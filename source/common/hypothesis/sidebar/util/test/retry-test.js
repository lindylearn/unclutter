import * as retryUtil from '../retry';

describe('sidebar.util.retry', () => {
  describe('.retryPromiseOperation', () => {
    it('should return the result of the operation function', () => {
      const operation = sinon.stub().returns(Promise.resolve(42));
      const wrappedOperation = retryUtil.retryPromiseOperation(operation);
      return wrappedOperation.then(result => {
        assert.equal(result, 42);
      });
    });

    it('should retry the operation if it fails', () => {
      const results = [new Error('fail'), 'ok'];
      const operation = sinon.spy(() => {
        const nextResult = results.shift();
        if (nextResult instanceof Error) {
          return Promise.reject(nextResult);
        } else {
          return Promise.resolve(nextResult);
        }
      });
      const wrappedOperation = retryUtil.retryPromiseOperation(operation, {
        minTimeout: 1,
      });
      return wrappedOperation.then(result => {
        assert.equal(result, 'ok');
      });
    });

    it('should return the error if it repeatedly fails', async () => {
      const error = new Error('error');
      const operation = sinon.spy(() => {
        return Promise.reject(error);
      });
      const wrappedOperation = retryUtil.retryPromiseOperation(operation, {
        minTimeout: 3,
        retries: 2,
      });
      await assert.rejects(wrappedOperation, 'error');
    });
  });
});
