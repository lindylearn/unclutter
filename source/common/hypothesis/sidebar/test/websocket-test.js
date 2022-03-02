import {
  Socket,
  CLOSE_NORMAL,
  CLOSE_GOING_AWAY,
  CLOSE_ABNORMAL,
  RECONNECT_MIN_DELAY,
} from '../websocket';

describe('websocket wrapper', () => {
  let fakeSocket;
  let clock;
  let connectionCount;

  class FakeWebSocket {
    constructor() {
      ++connectionCount;

      this.close = sinon.stub();
      this.send = sinon.stub();
      fakeSocket = this; // eslint-disable-line consistent-this
    }
  }
  FakeWebSocket.OPEN = 1;

  const WebSocket = window.WebSocket;

  beforeEach(() => {
    global.WebSocket = FakeWebSocket;
    clock = sinon.useFakeTimers();
    connectionCount = 0;

    // Suppress warnings of WebSocket issues in tests for handling
    // of abnormal disconnections
    sinon.stub(console, 'warn');
    sinon.stub(console, 'error');
  });

  afterEach(() => {
    global.WebSocket = WebSocket;
    clock.restore();
    console.warn.restore();
    console.error.restore();
  });

  context('when the connection is closed by the browser or server', () => {
    it('should reconnect after an abnormal disconnection', () => {
      new Socket('ws://test:1234');
      assert.ok(fakeSocket);
      const initialSocket = fakeSocket;
      fakeSocket.onopen({});
      fakeSocket.onclose({ code: CLOSE_ABNORMAL });
      clock.tick(2000);
      assert.ok(fakeSocket);
      assert.notEqual(fakeSocket, initialSocket);
    });

    it('should reconnect if initial connection fails', () => {
      new Socket('ws://test:1234');
      assert.ok(fakeSocket);
      const initialSocket = fakeSocket;
      fakeSocket.onopen({});
      fakeSocket.onclose({ code: CLOSE_ABNORMAL });
      clock.tick(4000);
      assert.ok(fakeSocket);
      assert.notEqual(fakeSocket, initialSocket);
    });

    it('should send queued messages after a reconnect', () => {
      // simulate WebSocket setup and initial connection
      const socket = new Socket('ws://test:1234');
      fakeSocket.onopen({});

      // simulate abnormal disconnection
      fakeSocket.onclose({ code: CLOSE_ABNORMAL });

      // enqueue a message and check that it is sent after the WS reconnects
      socket.send({ aKey: 'aValue' });
      fakeSocket.onopen({});
      assert.calledWith(fakeSocket.send, '{"aKey":"aValue"}');
    });

    [CLOSE_NORMAL, CLOSE_GOING_AWAY].forEach(closeCode => {
      it('should not reconnect after a normal disconnection', () => {
        new Socket('ws://test:1234');
        assert.ok(fakeSocket);
        const initialSocket = fakeSocket;

        fakeSocket.onopen({});
        fakeSocket.onclose({ code: closeCode });
        clock.tick(4000);

        assert.ok(fakeSocket);
        assert.equal(fakeSocket, initialSocket);
      });
    });

    it('should stop trying to reconnect after 10 retries', () => {
      new Socket('ws://test:1234');
      connectionCount = 0;

      for (let attempt = 1; attempt <= 11; attempt++) {
        fakeSocket.onclose({ code: CLOSE_ABNORMAL });

        // The delay between retries is a random value between `minTimeout` and
        // `minTimeout * (backoffFactor ** attempt)`. See docs for "retry" package.
        const minTimeout = RECONNECT_MIN_DELAY;
        const backoffFactor = 2; // Default exponential factor for "retry" package
        const maxDelay = minTimeout * Math.pow(backoffFactor, attempt);
        clock.tick(maxDelay);
      }

      assert.equal(connectionCount, 10);
      assert.calledWith(
        console.error,
        'Reached max retries attempting to reconnect WebSocket'
      );
    });
  });

  it('should queue messages sent prior to connection', () => {
    const socket = new Socket('ws://test:1234');
    socket.send({ abc: 'foo' });
    assert.notCalled(fakeSocket.send);
    fakeSocket.onopen({});
    assert.calledWith(fakeSocket.send, '{"abc":"foo"}');
  });

  it('should send messages immediately when connected', () => {
    const socket = new Socket('ws://test:1234');
    fakeSocket.readyState = FakeWebSocket.OPEN;
    socket.send({ abc: 'foo' });
    assert.calledWith(fakeSocket.send, '{"abc":"foo"}');
  });

  it('should emit "message" event for received messages', () => {
    const socket = new Socket('ws://test:1234');
    const onMessage = sinon.stub();
    socket.on('message', onMessage);

    const event = new MessageEvent('message', {
      data: 'Test message',
    });
    fakeSocket.onmessage(event);

    assert.calledWith(onMessage, event);
  });

  it('should emit "error" event for received errors', () => {
    const socket = new Socket('ws://test:1234');
    const onError = sinon.stub();
    socket.on('error', onError);

    const event = new ErrorEvent('Something went wrong');
    fakeSocket.onerror(event);

    assert.calledWith(onError, event);
  });

  describe('#close', () => {
    it('should close the socket with a normal status', () => {
      const socket = new Socket('ws://test:1234');
      socket.close();
      assert.calledWith(fakeSocket.close, CLOSE_NORMAL);
    });

    it('should not reconnect after closing', () => {
      const socket = new Socket('ws://test:1234');
      const initialSocket = fakeSocket;

      socket.close();

      clock.tick(2000);
      assert.equal(fakeSocket, initialSocket);
    });
  });
});
