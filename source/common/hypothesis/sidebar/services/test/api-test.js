import fetchMock from 'fetch-mock';

import { APIService } from '../api';

// API route directory.
//
// This should mirror https://hypothes.is/api/. The domain name has been changed
// to guard against hardcoding of "hypothes.is".
//
// This can be updated by running:
//
// `curl https://hypothes.is/api/ | sed 's/hypothes.is/example.com/g' | jq . > api-index.json`
//
const routes = require('./api-index.json').links;

describe('APIService', () => {
  let fakeAuth;
  let fakeStore;
  let api;

  function defaultBodyForStatus(status) {
    if (status === 204) {
      return null;
    } else if (status >= 500) {
      return '<html><body>Internal Server Error</body></html>';
    } else {
      return {};
    }
  }

  /**
   * Expect an HTTP call using `window.fetch`.
   *
   * @param {string} method - Expected HTTP method (lower case)
   * @param {string} pathAndQuery - Expected part of URL after API root
   * @param {number|null} status -
   *   Expected HTTP status. If `null` then the call to `fetch` will reject with
   *   the content of `body` as the error message.
   * @param {Object|string} body - Expected response body or error message
   */
  function expectCall(
    method,
    pathAndQuery,
    status = 200,
    body = defaultBodyForStatus(status)
  ) {
    const url = `https://example.com/api/${pathAndQuery}`;
    if (status > 0) {
      fetchMock.mock(url, { status, body }, { method });
    } else {
      fetchMock.mock(
        url,
        {
          status,
          throws: new Error(body),
        },
        { method }
      );
    }
  }

  beforeEach(() => {
    const fakeApiRoutes = {
      links: sinon.stub(),
      routes: sinon.stub().returns(Promise.resolve(routes)),
    };
    fakeAuth = {
      getAccessToken: sinon.stub().returns(Promise.resolve('faketoken')),
    };
    fakeStore = {
      apiRequestStarted: sinon.stub(),
      apiRequestFinished: sinon.stub(),
    };

    api = new APIService(fakeApiRoutes, fakeAuth, fakeStore);

    fetchMock.catch(() => {
      throw new Error('Unexpected `fetch` call');
    });
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('saves a new annotation', () => {
    // nb. The Hypothesis API returns 200 here not 201 as one might expect.
    expectCall('post', 'annotations', 200, { id: 'new-id' });

    return api.annotation.create({}, {}).then(ann => {
      assert.equal(ann.id, 'new-id');
    });
  });

  it('updates an annotation', () => {
    expectCall('patch', 'annotations/an-id');
    return api.annotation.update({ id: 'an-id' }, { text: 'updated' });
  });

  it('deletes an annotation', () => {
    expectCall('delete', 'annotations/an-id');
    return api.annotation.delete({ id: 'an-id' }, {});
  });

  it('flags an annotation', () => {
    expectCall('put', 'annotations/an-id/flag', 204);
    return api.annotation.flag({ id: 'an-id' });
  });

  it('hides an annotation', () => {
    expectCall('put', 'annotations/an-id/hide', 204);
    return api.annotation.hide({ id: 'an-id' });
  });

  it('unhides an annotation', () => {
    expectCall('delete', 'annotations/an-id/hide', 204);
    return api.annotation.unhide({ id: 'an-id' });
  });

  it('removes current user from a group', () => {
    expectCall('delete', 'groups/an-id/members/me', 204);
    return api.group.member.delete({ pubid: 'an-id', userid: 'me' });
  });

  it('gets a group by provided group id', () => {
    const group = { id: 'group-id', name: 'Group' };
    expectCall('get', 'groups/group-id', 200, group);
    return api.group.read({ id: 'group-id' }).then(group_ => {
      assert.deepEqual(group_, group);
    });
  });

  it('removes internal properties before sending data to the server', () => {
    const annotation = {
      $highlight: true,
      $notme: 'nooooo!',
      allowed: 123,
    };
    expectCall('post', 'annotations', 200, { id: 'test' });
    return api.annotation.create({}, annotation).then(() => {
      const [, options] = fetchMock.lastCall();
      assert.deepEqual(options.body, JSON.stringify({ allowed: 123 }));
    });
  });

  // Test that semicolons are correctly encoded in the query string, which is
  // important as they are treated as query param delimiters by the API.
  //
  // This used to require custom code when using AngularJS but `fetch` handles
  // this correctly for us. The test has been kept to catch any regressions.
  it('encodes semicolons in query parameters', () => {
    expectCall(
      'get',
      'search?uri=http%3A%2F%2Ffoobar.com%2F%3Ffoo%3Dbar%3Bbaz%3Dqux'
    );
    return api.search({ uri: 'http://foobar.com/?foo=bar;baz=qux' });
  });

  // Test that covers the most critical use case of multiple values being
  // provided for an API parameter. Other API calls accept multiple values
  // as well though.
  it('repeats query parameters when multiple values are provided', () => {
    const pdfURL = 'https://example.com/test.pdf';
    const fingerprintURL = 'urn:x-pdf:foobar';

    expectCall(
      'get',
      `search?uri=${encodeURIComponent(pdfURL)}&uri=${encodeURIComponent(
        fingerprintURL
      )}`
    );

    return api.search({ uri: [pdfURL, fingerprintURL] });
  });

  // Test serialization of nullish parameters in API calls. This behavior matches
  // the query-string package that we used to use.
  it('sends empty query parameters if value is nullish', () => {
    expectCall('get', 'search?c=false');

    return api.search({ a: undefined, b: null, c: false, d: [null] });
  });

  it("fetches the user's profile", () => {
    const profile = { userid: 'acct:user@publisher.org' };
    expectCall('get', 'profile?authority=publisher.org', 200, profile);
    return api.profile.read({ authority: 'publisher.org' }).then(profile_ => {
      assert.deepEqual(profile_, profile);
    });
  });

  it("updates a user's profile", () => {
    expectCall('patch', 'profile');
    return api.profile.update({}, { preferences: {} });
  });

  context('when an API call fails', () => {
    [
      {
        // Network error
        status: null,
        body: 'Service unreachable.',
        expectedMessage: 'Network request failed: Service unreachable.',
      },
      {
        // Request failed with an error given in the JSON body
        status: 404,
        statusText: 'Not found',
        body: {
          reason: 'Thing not found',
        },
        expectedMessage: 'Network request failed (404): Thing not found',
      },
      {
        // Request failed with a non-JSON response
        status: 500,
        statusText: 'Server Error',
        body: 'Internal Server Error',
        expectedMessage:
          'Network request failed (500): Failed to parse response',
      },
    ].forEach(({ status, body, expectedMessage }) => {
      it('rejects the call with an error', () => {
        expectCall('patch', 'profile', status, body);
        return api.profile.update({}, { preferences: {} }).catch(err => {
          assert(err instanceof Error);
          assert.equal(err.message, expectedMessage);
        });
      });
    });
  });

  it('API calls return the JSON response', () => {
    expectCall('get', 'profile', 200, { userid: 'acct:user@example.com' });
    return api.profile.read({}).then(response => {
      assert.match(
        response,
        sinon.match({
          userid: 'acct:user@example.com',
        })
      );
    });
  });

  it('omits Authorization header if no access token is available', () => {
    fakeAuth.getAccessToken.returns(Promise.resolve(null));
    expectCall('get', 'profile');
    return api.profile.read().then(() => {
      const [, options] = fetchMock.lastCall();
      assert.isFalse('Authorization' in options.headers);
    });
  });

  it('sets Authorization header if access token is available', () => {
    expectCall('get', 'profile');
    return api.profile.read().then(() => {
      const [, options] = fetchMock.lastCall();
      assert.equal(options.headers.Authorization, 'Bearer faketoken');
    });
  });

  it('sends client version custom request header', () => {
    expectCall('get', 'profile');
    return api.profile.read({}).then(() => {
      const [, options] = fetchMock.lastCall();
      assert.equal(options.headers['Hypothesis-Client-Version'], '__VERSION__');
    });
  });

  it('dispatches store actions when an API request starts and completes successfully', () => {
    expectCall('get', 'profile');
    return api.profile.read({}).then(() => {
      assert.isTrue(
        fakeStore.apiRequestFinished.calledAfter(fakeStore.apiRequestStarted)
      );
    });
  });

  it('dispatches store actions when an API request starts and fails', () => {
    expectCall('get', 'profile', 400);
    return api.profile.read({}).catch(() => {
      assert.isTrue(
        fakeStore.apiRequestFinished.calledAfter(fakeStore.apiRequestStarted)
      );
    });
  });

  it('dispatches store actions if API request fails with a network error', () => {
    expectCall('get', 'profile', null, 'Network error');

    return api.profile.read({}).catch(() => {
      assert.isTrue(
        fakeStore.apiRequestFinished.calledAfter(fakeStore.apiRequestStarted)
      );
    });
  });

  it('does not send a client ID by default', () => {
    expectCall('get', 'profile');
    return api.profile.read({}).then(() => {
      const [, options] = fetchMock.lastCall();
      assert.isFalse('X-Client-Id' in options.headers);
    });
  });

  it('sends a client ID in the X-Client-Id header if configured', () => {
    expectCall('get', 'profile');
    api.setClientId('1234-5678');
    return api.profile.read({}).then(() => {
      const [, options] = fetchMock.lastCall();
      assert.equal(options.headers['X-Client-Id'], '1234-5678');
    });
  });
});
