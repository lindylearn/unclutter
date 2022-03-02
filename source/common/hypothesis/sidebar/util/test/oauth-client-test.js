import fetchMock from 'fetch-mock';
import sinon from 'sinon';

import FakeWindow from '../../test/fake-window';
import OAuthClient, { TokenError, $imports } from '../oauth-client';

const fixtures = {
  tokenResponse: {
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    expires_in: 360,
  },

  parsedToken: {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',

    // This assumes the `tokenResponse` above was received when
    // `Date.now() === 0`.
    expiresAt: 350000,
  },
};

describe('sidebar/util/oauth-client', () => {
  let client;
  let clock;
  const config = {
    clientId: '1234-5678',
    authorizationEndpoint: 'https://annota.te/oauth/authorize',
    tokenEndpoint: 'https://annota.te/api/token',
    revokeEndpoint: 'https://annota.te/oauth/revoke',
  };

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    fetchMock.catch(() => {
      throw new Error('Unexpected fetch call');
    });

    client = new OAuthClient(config);
  });

  afterEach(() => {
    $imports.$restore();
    fetchMock.restore();
    clock.restore();
  });

  /**
   * Check that a POST request was made with the given URL-encoded form data.
   *
   * @param {string} expectedBody
   */
  function assertFormPost(expectedBody) {
    assert.isTrue(fetchMock.called());
    const [, options] = fetchMock.lastCall();
    assert.deepEqual(options, {
      body: expectedBody,
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }

  describe('#exchangeAuthCode', () => {
    it('makes a POST request to the token endpoint', () => {
      fetchMock.post(config.tokenEndpoint, {
        body: fixtures.tokenResponse,
      });
      return client.exchangeAuthCode('letmein').then(() => {
        const expectedBody =
          'client_id=1234-5678&code=letmein&grant_type=authorization_code';
        assertFormPost(expectedBody);
      });
    });

    it('resolves with the parsed token data', () => {
      fetchMock.post(config.tokenEndpoint, {
        body: fixtures.tokenResponse,
      });
      return client.exchangeAuthCode('letmein').then(token => {
        assert.deepEqual(token, fixtures.parsedToken);
      });
    });

    it('rejects if the request fails', () => {
      fetchMock.post(config.tokenEndpoint, {
        status: 400,
      });
      return client.exchangeAuthCode('unknowncode').catch(err => {
        assert.instanceOf(err, TokenError);
        assert.equal(err.message, 'Failed to fetch access token');
      });
    });
  });

  describe('#exchangeGrantToken', () => {
    it('makes a POST request to the token endpoint', () => {
      fetchMock.post(config.tokenEndpoint, {
        body: fixtures.tokenResponse,
      });
      return client.exchangeGrantToken('letmein').then(() => {
        const expectedBody =
          'assertion=letmein' +
          '&grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer';
        assertFormPost(expectedBody);
      });
    });

    it('resolves with the parsed token data', () => {
      fetchMock.post(config.tokenEndpoint, {
        body: fixtures.tokenResponse,
      });

      return client.exchangeGrantToken('letmein').then(token => {
        assert.deepEqual(token, fixtures.parsedToken);
      });
    });

    it('rejects if the request fails', () => {
      fetchMock.post(config.tokenEndpoint, {
        status: 400,
      });
      return client.exchangeGrantToken('unknowntoken').catch(err => {
        assert.instanceOf(err, TokenError);
        assert.equal(err.message, 'Failed to fetch access token');
      });
    });
  });

  describe('#refreshToken', () => {
    it('makes a POST request to the token endpoint', () => {
      fetchMock.post(config.tokenEndpoint, {
        body: fixtures.tokenResponse,
      });

      return client.refreshToken('valid-refresh-token').then(() => {
        const expectedBody =
          'grant_type=refresh_token&refresh_token=valid-refresh-token';
        assertFormPost(expectedBody);
      });
    });

    it('resolves with the parsed token data', () => {
      fetchMock.post(config.tokenEndpoint, {
        body: fixtures.tokenResponse,
      });

      return client.refreshToken('valid-refresh-token').then(token => {
        assert.deepEqual(token, fixtures.parsedToken);
      });
    });

    it('rejects if the request fails', () => {
      fetchMock.post(config.tokenEndpoint, { status: 400 });
      return client.refreshToken('invalid-token').catch(err => {
        assert.instanceOf(err, TokenError);
        assert.equal(err.message, 'Failed to fetch access token');
      });
    });
  });

  describe('#revokeToken', () => {
    it('makes a POST request to the revoke endpoint', () => {
      fetchMock.post(config.revokeEndpoint, {
        body: fixtures.tokenResponse,
      });

      return client.revokeToken('valid-access-token').then(() => {
        const expectedBody = 'token=valid-access-token';
        assertFormPost(expectedBody);
      });
    });

    it('resolves if the request succeeds', () => {
      fetchMock.post(config.revokeEndpoint, { status: 200, body: {} });
      return client.revokeToken('valid-access-token');
    });

    it('rejects if the request fails', () => {
      fetchMock.post(config.revokeEndpoint, { status: 400 });
      return client.revokeToken('invalid-token').catch(err => {
        assert.instanceOf(err, TokenError);
        assert.equal(err.message, 'Failed to revoke access token');
      });
    });
  });

  describe('#openAuthPopupWindow', () => {
    it('opens a popup window', () => {
      const fakeWindow = new FakeWindow();
      const popupWindow = OAuthClient.openAuthPopupWindow(fakeWindow);
      assert.equal(popupWindow, fakeWindow.open.returnValues[0]);
      assert.calledWith(
        fakeWindow.open,
        'about:blank',
        'Log in to Hypothesis',
        'left=274.5,top=169,width=475,height=430'
      );
    });

    it('throws error if popup cannot be opened', () => {
      const fakeWindow = new FakeWindow();
      fakeWindow.open = sinon.stub().returns(null);

      assert.throws(() => {
        OAuthClient.openAuthPopupWindow(fakeWindow);
      }, 'Failed to open login window');
    });
  });

  describe('#authorize', () => {
    let fakeWindow;

    beforeEach(() => {
      fakeWindow = new FakeWindow();

      $imports.$mock({
        './random': {
          generateHexString: () => 'notrandom',
        },
      });
    });

    function authorize() {
      const popupWindow = OAuthClient.openAuthPopupWindow(fakeWindow);
      const authorized = client.authorize(fakeWindow, popupWindow);
      return { authorized, popupWindow };
    }

    it('navigates the popup window to the authorization URL', () => {
      const { authorized, popupWindow } = authorize();

      fakeWindow.sendMessage({
        type: 'authorization_response',
        code: 'expected-code',
        state: 'notrandom',
      });

      return authorized.then(() => {
        const params = new URLSearchParams({
          client_id: config.clientId,
          origin: 'https://client.hypothes.is',
          response_mode: 'web_message',
          response_type: 'code',
          state: 'notrandom',
        });
        const expectedAuthUrl = `${config.authorizationEndpoint}?${params}`;
        assert.equal(popupWindow.location.href, expectedAuthUrl);
      });
    });

    it('resolves with an auth code if successful', () => {
      const { authorized } = authorize();

      fakeWindow.sendMessage({
        type: 'authorization_response',
        code: 'expected-code',
        state: 'notrandom',
      });

      return authorized.then(code => {
        assert.equal(code, 'expected-code');
      });
    });

    it('rejects with an error if canceled', () => {
      const { authorized } = authorize();

      fakeWindow.sendMessage({
        type: 'authorization_canceled',
        state: 'notrandom',
      });

      return authorized.catch(err => {
        assert.equal(err.message, 'Authorization window was closed');
      });
    });

    it('ignores responses with incorrect "state" values', () => {
      const { authorized } = authorize();

      fakeWindow.sendMessage({
        type: 'authorization_response',
        code: 'first-code',
        state: 'wrongstate',
      });

      fakeWindow.sendMessage({
        type: 'authorization_response',
        code: 'second-code',
        state: 'notrandom',
      });

      return authorized.then(code => {
        assert.equal(code, 'second-code');
      });
    });
  });
});
