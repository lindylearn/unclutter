import { FetchError, fetchJSON } from '../fetch';

describe('sidebar/util/fetch', () => {
  describe('fetchJSON', () => {
    let fakeResponse;

    beforeEach(() => {
      fakeResponse = {
        status: 200,
        json: sinon.stub().resolves({}),
        get ok() {
          return this.status >= 200 && this.status <= 299;
        },
      };
      sinon.stub(window, 'fetch').resolves(fakeResponse);
      window.fetch.resolves(fakeResponse);
    });

    afterEach(() => {
      window.fetch.restore();
    });

    it('fetches the requested URL', async () => {
      const init = { method: 'GET' };
      await fetchJSON('https://example.com', init);
      assert.calledWith(window.fetch, 'https://example.com', init);
    });

    it('throws a FetchError if `fetch` fails', async () => {
      window.fetch.rejects(new Error('Fetch failed'));

      let err;
      try {
        await fetchJSON('https://example.com');
      } catch (e) {
        err = e;
      }

      assert.instanceOf(err, FetchError);
      assert.equal(err.url, 'https://example.com');
      assert.equal(err.response, null);
      assert.include(err.message, 'Network request failed: Fetch failed');
    });

    it('returns null if the response succeeds with a 204 status', async () => {
      fakeResponse.status = 204;
      const result = await fetchJSON('https://example.com');
      assert.strictEqual(result, null);
    });

    it('throws a FetchError if parsing JSON response fails', async () => {
      fakeResponse.json.rejects(new Error('Oh no'));
      let err;
      try {
        await fetchJSON('https://example.com');
      } catch (e) {
        err = e;
      }
      assert.instanceOf(err, FetchError);
      assert.equal(err.url, 'https://example.com');
      assert.equal(err.response, fakeResponse);
      assert.equal(
        err.message,
        'Network request failed (200): Failed to parse response'
      );
    });

    it('throws a FetchError if the response has a non-2xx status code', async () => {
      fakeResponse.status = 404;
      fakeResponse.json.resolves({ reason: 'Thing not found' });
      let err;
      try {
        err = await fetchJSON('https://example.com');
      } catch (e) {
        err = e;
      }
      assert.instanceOf(err, FetchError);
      assert.equal(err.url, 'https://example.com');
      assert.equal(err.response, fakeResponse);
      assert.equal(
        err.message,
        'Network request failed (404): Thing not found'
      );
    });

    it('returns the parsed JSON response if the request was successful', async () => {
      fakeResponse.json.resolves({ foo: 'bar' });
      const result = await fetchJSON('https://example.com');
      assert.deepEqual(result, { foo: 'bar' });
    });
  });
});
