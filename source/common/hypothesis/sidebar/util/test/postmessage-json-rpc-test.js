import EventEmitter from 'tiny-emitter';

import { call } from '../postmessage-json-rpc';

class FakeWindow {
  constructor() {
    this.emitter = new EventEmitter();
    this.addEventListener = this.emitter.on.bind(this.emitter);
    this.removeEventListener = this.emitter.off.bind(this.emitter);
  }
}

describe('sidebar/util/postmessage-json-rpc', () => {
  const origin = 'https://embedder.com';
  const messageId = 42;

  describe('call', () => {
    let frame;
    let fakeWindow;

    function doCall(timeout = 1) {
      return call(
        frame,
        origin,
        'testMethod',
        [1, 2, 3],
        timeout,
        fakeWindow,
        messageId
      );
    }

    beforeEach(() => {
      frame = { postMessage: sinon.stub() };
      fakeWindow = new FakeWindow();
    });

    it('sends a message to the target frame', () => {
      doCall().catch(() => {} /* Ignore timeout. */);

      assert.calledWith(frame.postMessage, {
        jsonrpc: '2.0',
        id: messageId,
        method: 'testMethod',
        params: [1, 2, 3],
      });
    });

    it('rejects if `postMessage` fails', async () => {
      frame.postMessage.throws(new Error('Nope!'));
      await assert.rejects(doCall(), 'Nope!');
    });

    [
      {
        // Wrong origin.
        origin: 'https://not-the-embedder.com',
        data: {
          jsonrpc: '2.0',
          id: messageId,
        },
      },
      {
        // Non-object `data` field.
        origin,
        data: null,
      },
      {
        // No jsonrpc header
        origin,
        data: {},
      },
      {
        // No ID
        origin,
        data: {
          jsonrpc: '2.0',
        },
      },
      {
        // ID mismatch
        origin,
        data: {
          jsonrpc: '2.0',
          id: 'wrong-id',
        },
      },
    ].forEach(reply => {
      it('ignores messages that do not have required reply fields', () => {
        const result = doCall();

        fakeWindow.emitter.emit('message', reply);

        const notCalled = Promise.resolve('notcalled');
        return Promise.race([result, notCalled]).then(result => {
          assert.equal(result, 'notcalled');
        });
      });
    });

    it('rejects with an error if the `error` field is set in the response', async () => {
      const result = doCall();
      fakeWindow.emitter.emit('message', {
        origin,
        data: {
          jsonrpc: '2.0',
          id: messageId,
          error: {
            message: 'Something went wrong',
          },
        },
      });
      await assert.rejects(result, 'Something went wrong');
    });

    it('rejects if no `error` or `result` field is set in the response', async () => {
      const result = doCall();
      fakeWindow.emitter.emit('message', {
        origin,
        data: { jsonrpc: '2.0', id: messageId },
      });
      await assert.rejects(result, 'RPC reply had no result or error');
    });

    it('resolves with the result if the `result` field is set in the response', () => {
      const result = doCall();
      const expectedResult = { foo: 'bar' };
      fakeWindow.emitter.emit('message', {
        origin,
        data: {
          jsonrpc: '2.0',
          id: messageId,
          result: expectedResult,
        },
      });

      return result.then(result => {
        assert.deepEqual(result, expectedResult);
      });
    });

    it('rejects with an error if the timeout is exceeded', async () => {
      await assert.rejects(
        doCall(),
        'Request to https://embedder.com timed out'
      );
    });

    it('if timeout is null, then it does not timeout', async () => {
      const clock = sinon.useFakeTimers();
      const result = doCall(null);
      clock.tick(100000); // wait a long time
      fakeWindow.emitter.emit('message', {
        origin,
        data: {
          jsonrpc: '2.0',
          id: messageId,
          result: {},
        },
      });
      await result;
      clock.restore();
    });
  });
});
