import { Bridge } from '../../bridge';

describe('PortRPC-Bridge integration', () => {
  let clock;
  let port1;
  let port2;
  let bridges = [];

  function createBridge() {
    const bridge = new Bridge();
    bridges.push(bridge);
    return bridge;
  }

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    const channel = new MessageChannel();
    port1 = channel.port1;
    port2 = channel.port2;
  });

  afterEach(() => {
    bridges.forEach(bridge => bridge.destroy());
    clock.restore();
  });

  describe('establishing a connection', () => {
    it('should invoke Bridge `onConnect` callbacks after connecting', async () => {
      const bridge = createBridge();
      const reciprocalBridge = createBridge();
      reciprocalBridge.on('method', cb => cb(null));
      let callbackCount = 0;
      const callback = () => {
        ++callbackCount;
      };
      bridge.onConnect(callback);
      bridge.onConnect(callback); // allows multiple callbacks to be registered
      reciprocalBridge.onConnect(callback);

      const channel = bridge.createChannel(port1);
      const reciprocalChannel = reciprocalBridge.createChannel(port2);
      await bridge.call('method');

      assert.equal(callbackCount, 3);

      // Additional calls to the RPC `connect` method are ignored
      await channel.call('connect');
      await reciprocalChannel.call('connect');
      await bridge.call('method');

      assert.equal(callbackCount, 3);
    });
  });

  describe('sending and receiving RPC messages', () => {
    it('should invoke Bridge method handler on every channel when calling a RPC method', async () => {
      const bridge = createBridge();
      const otherChannel = new MessageChannel();
      bridge.createChannel(port1);
      bridge.createChannel(otherChannel.port1);
      const reciprocalBridge1 = createBridge();
      const reciprocalBridge2 = createBridge();
      reciprocalBridge1.on('method1', (arg, cb) => cb(null, `${arg}foo`));
      reciprocalBridge2.on('method1', (arg, cb) => cb(null, `${arg}bar`));
      reciprocalBridge1.createChannel(port2);
      reciprocalBridge2.createChannel(otherChannel.port2);

      const results = await bridge.call('method1', 'param1');

      assert.deepEqual(results.sort(), ['param1foo', 'param1bar'].sort());
    });
  });

  describe('errors and timeouts', () => {
    it(`raises an error when the listener's callback fails`, async () => {
      const bridge = createBridge();
      const reciprocalBridge = createBridge();
      const errorMessage = 'My error';
      bridge.on('method1', (_arg, cb) => cb(errorMessage));
      bridge.createChannel(port1);
      reciprocalBridge.createChannel(port2);

      let error;
      try {
        await reciprocalBridge.call('method1', 'param1');
      } catch (err) {
        error = err;
      }

      assert.equal(error, errorMessage);
    });

    it('destroys the Bridge channel when a RPC message fails', async () => {
      const bridge = createBridge();
      const reciprocalBridge = createBridge();
      const errorMessage = 'My error';
      bridge.on('method1', (_arg, cb) => cb(errorMessage));
      bridge.createChannel(port1);
      const channel = reciprocalBridge.createChannel(port2);
      sinon.stub(channel, 'destroy').callThrough();

      let error;
      try {
        await reciprocalBridge.call('method1', 'param1');
      } catch (err) {
        error = err;
      }

      assert.called(channel.destroy);
      assert.equal(error, errorMessage);
      assert.deepEqual(reciprocalBridge.links, []);
    });

    it('no longer sends RPC messages to a Bridge channel that has received an error', async () => {
      const bridge = createBridge();
      const reciprocalBridge = createBridge();
      const errorMessage = 'My error';
      bridge.on('method1', (_arg, cb) => cb(new Error(errorMessage)));
      bridge.createChannel(port1);
      const channel = reciprocalBridge.createChannel(port2);
      sinon.stub(channel, 'call').callThrough();

      let error;
      try {
        await reciprocalBridge.call('method1', 'param1');
      } catch (err) {
        error = err;
      }

      assert.equal(error.message, errorMessage);

      const results = await reciprocalBridge.call('method1', 'param1');

      assert.deepEqual(results, []);
      assert.calledOnce(channel.call);
    });

    it('timeouts if the Bridge channel is not connected', async () => {
      const bridge = createBridge();
      bridge.createChannel(port1);

      const promise = bridge.call('method1', 'param1');
      clock.tick(1000);
      const results = await promise;

      assert.deepEqual(results, [null]); // returns null for each channel that timeouts
    });

    it(`timeouts if the Bridge channel is connected but reciprocal Bridge channel doesn't answer`, async () => {
      const bridge = createBridge();
      const reciprocalBridge = createBridge();
      bridge.createChannel(port1);
      reciprocalBridge.createChannel(port2); // the reciprocal port hasn't registered a RPC method called 'method1'

      const promise = bridge.call('method1', 'param1');
      clock.tick(1000);
      const results = await promise;

      assert.deepEqual(results, [null]);
    });

    it('timeouts if the reciprocal Bridge channel has been destroyed', async () => {
      const bridge = createBridge();
      const reciprocalBridge = createBridge();
      bridge.on('method1', (arg, cb) => cb(null, `${arg}foo`));
      reciprocalBridge.on('method2', (arg, cb) => cb(null, `${arg}bar`));
      bridge.createChannel(port1);
      reciprocalBridge.createChannel(port2);

      reciprocalBridge.destroy();
      const promise = bridge.call('method2', 'param1');
      clock.tick(1000);
      const results0 = await promise;

      assert.deepEqual(results0, [null]);

      const results1 = await reciprocalBridge.call('method1', 'param1');

      assert.deepEqual(results1, []);
    });
  });
});
