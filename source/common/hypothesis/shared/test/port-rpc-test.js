import { PortRPC } from '../port-rpc';

describe('RPC', () => {
  let port1;
  let port2;
  let rpc1;
  let rpc2;
  let plusOne;

  /**
   * Wait for messages enqueued via `postMessage` to be delivered.
   */
  function waitForMessageDelivery() {
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  beforeEach(() => {
    const channel = new MessageChannel();
    port1 = channel.port1;
    port2 = channel.port2;

    // `concat` method for rpc1
    const concat = (arg0, ...args) => {
      const callback = args.pop();
      const result = arg0.concat(...args);
      callback(result);
    };

    rpc1 = new PortRPC(port1, {
      concat,
    });

    // `plusOne` method for rpc2
    plusOne = sinon.stub().callsFake((...numbers) => {
      const callback = numbers.pop();
      const result = numbers.map(value => value + 1);
      callback(result);
    });

    rpc2 = new PortRPC(port2, {
      plusOne,
    });
  });

  afterEach(() => {
    rpc1.destroy();
    rpc2.destroy();
  });

  it('should call the method `plusOne` on rpc2', done => {
    rpc1.call('plusOne', 1, 2, 3, value => {
      assert.deepEqual(value, [2, 3, 4]);
      done();
    });
  });

  it('should not call the method `plusOne` if rpc1 is destroyed', () => {
    rpc1.destroy();

    rpc1.call('plusOne', 1, 2, 3);
    assert.notCalled(plusOne);
  });

  it('should not call the method `plusOne` if rpc2 is destroyed', async () => {
    rpc2.destroy();

    rpc1.call('plusOne', 1, 2, 3, () => {});

    await waitForMessageDelivery();
    assert.notCalled(plusOne);
  });

  it('should call the method `concat` on rpc1', done => {
    rpc2.call('concat', 'hello', ' ', 'world', value => {
      assert.equal(value, 'hello world');
    });

    rpc2.call('concat', [1], [2], [3], value => {
      assert.deepEqual(value, [1, 2, 3]);
      done();
    });
  });

  it('should call method on valid message', async () => {
    port1.postMessage({
      arguments: [1, 2],
      method: 'plusOne',
      protocol: 'frame-rpc',
      version: '1.0.0',
    });

    await waitForMessageDelivery();
    assert.calledOnce(plusOne);
  });

  [
    {
      message: {
        arguments: 'test',
        method: 'plusOne',
        protocol: 'frame-rpc',
        version: '1.0.0',
      },
      reason: 'message has incorrect arguments',
    },

    {
      message: {
        arguments: [1, 2],
        method: 'dummy',
        protocol: 'frame-rpc',
        version: '1.0.0',
      },
      reason: 'message has incorrect method',
    },
    {
      message: {
        arguments: [1, 2],
        method: 'plusOne',
        protocol: 'dummy',
        version: '1.0.0',
      },
      reason: 'message has incorrect protocol',
    },

    {
      message: {
        arguments: [1, 2],
        method: 'plusOne',
        protocol: 'frame-rpc',
        version: 'dummy',
      },
      reason: 'message has incorrect version',
    },
    { message: {}, reason: 'message is an empty object' },
    { message: null, reason: 'message is `null`' },
    { message: undefined, reason: 'message is `undefined`' },
    { message: 0, reason: 'message is `0`' },
    { message: '', reason: 'message is empty string' },
    { message: 'dummy', reason: 'message is a string' },
  ].forEach(({ message, reason }) =>
    it(`should not call method on invalid messages (${reason})`, async () => {
      port1.postMessage(message);

      await waitForMessageDelivery();
      assert.notCalled(plusOne);
    })
  );
});
