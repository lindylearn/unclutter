import EventEmitter from 'tiny-emitter';

import { SessionService, $imports } from '../session';

describe('SessionService', () => {
  let fakeApi;
  let fakeAuth;
  let fakeSentry;
  let fakeServiceConfig;
  let fakeSettings;
  let fakeStore;
  let fakeToastMessenger;

  beforeEach(() => {
    let currentProfile = {
      userid: null,
    };

    fakeStore = {
      profile: sinon.stub().returns(currentProfile),
      updateProfile: sinon.stub().callsFake(newProfile => {
        currentProfile = newProfile;
      }),
    };
    fakeAuth = Object.assign(new EventEmitter(), {
      login: sinon.stub().returns(Promise.resolve()),
      logout: sinon.stub().resolves(),
    });
    fakeSentry = {
      setUserInfo: sinon.spy(),
    };
    fakeApi = {
      profile: {
        read: sinon.stub().resolves(),
        update: sinon.stub().resolves({}),
      },
    };
    fakeServiceConfig = sinon.stub().returns(null);
    fakeSettings = {
      serviceUrl: 'https://test.hypothes.is/root/',
    };
    fakeToastMessenger = { error: sinon.spy() };

    const retryPromiseOperation = async callback => {
      const maxRetries = 3;
      let lastError;
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await callback();
        } catch (err) {
          lastError = err;
        }
      }
      throw lastError;
    };

    $imports.$mock({
      '../config/service-config': { serviceConfig: fakeServiceConfig },
      '../util/retry': { retryPromiseOperation },
      '../util/sentry': fakeSentry,
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  function createService() {
    return new SessionService(
      fakeStore,
      fakeApi,
      fakeAuth,
      fakeSettings,
      fakeToastMessenger
    );
  }

  describe('#load', () => {
    context('when the host page provides an OAuth grant token', () => {
      beforeEach(() => {
        fakeServiceConfig.returns({
          authority: 'publisher.org',
          grantToken: 'a.jwt.token',
        });
        fakeApi.profile.read.returns(
          Promise.resolve({
            userid: 'acct:user@publisher.org',
          })
        );
      });

      it('should pass the "authority" param when fetching the profile', () => {
        const session = createService();
        return session.load().then(() => {
          assert.calledWith(fakeApi.profile.read, {
            authority: 'publisher.org',
          });
        });
      });

      it('should update the session with the profile data from the API', () => {
        const session = createService();
        return session.load().then(() => {
          assert.calledWith(fakeStore.updateProfile, {
            userid: 'acct:user@publisher.org',
          });
        });
      });
    });

    context('when using a first party account', () => {
      let clock;

      beforeEach(() => {
        fakeApi.profile.read.returns(
          Promise.resolve({
            userid: 'acct:user@hypothes.is',
          })
        );
      });

      afterEach(() => {
        if (clock) {
          clock.restore();
        }
      });

      it('should fetch profile data from the API', () => {
        const session = createService();
        return session.load().then(() => {
          assert.calledWith(fakeApi.profile.read);
        });
      });

      it('should retry the profile fetch if it fails', () => {
        const fetchedProfile = {
          userid: 'acct:user@hypothes.is',
          groups: [],
        };

        fakeApi.profile.read
          .onCall(0)
          .returns(Promise.reject(new Error('Server error')));
        fakeApi.profile.read.onCall(1).returns(Promise.resolve(fetchedProfile));

        const session = createService();
        return session.load().then(() => {
          assert.calledOnce(fakeStore.updateProfile);
          assert.calledWith(fakeStore.updateProfile, fetchedProfile);
        });
      });

      it('should reject if the profile fetch repeatedly fails', async () => {
        const fetchError = new Error('Server error');
        fakeApi.profile.read.rejects(fetchError);

        const session = createService();

        await assert.rejects(session.load(), fetchError.message);
        assert.notCalled(fakeStore.updateProfile);
      });

      it('should update the session with the profile data from the API', () => {
        const session = createService();
        return session.load().then(() => {
          assert.calledOnce(fakeStore.updateProfile);
          assert.calledWith(fakeStore.updateProfile, {
            userid: 'acct:user@hypothes.is',
          });
        });
      });

      it('should cache the returned profile data', () => {
        const session = createService();
        return session
          .load()
          .then(() => {
            return session.load();
          })
          .then(() => {
            assert.calledOnce(fakeApi.profile.read);
          });
      });

      it('should eventually expire the cache', () => {
        clock = sinon.useFakeTimers();
        const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

        const session = createService();
        return session
          .load()
          .then(() => {
            clock.tick(CACHE_TTL * 2);
            return session.load();
          })
          .then(() => {
            assert.calledTwice(fakeApi.profile.read);
          });
      });
    });
  });

  describe('#update', () => {
    it('updates the user ID for Sentry error reports', () => {
      const session = createService();
      session.update({
        userid: 'anne',
      });
      assert.calledWith(fakeSentry.setUserInfo, {
        id: 'anne',
      });
    });
  });

  describe('#dismissSidebarTutorial', () => {
    beforeEach(() => {
      fakeApi.profile.update.returns(
        Promise.resolve({
          preferences: {},
        })
      );
    });

    it('disables the tutorial for the user', () => {
      const session = createService();
      session.dismissSidebarTutorial();
      assert.calledWith(
        fakeApi.profile.update,
        {},
        { preferences: { show_sidebar_tutorial: false } }
      );
    });

    it('should update the session with the response from the API', () => {
      const session = createService();
      return session.dismissSidebarTutorial().then(() => {
        assert.calledOnce(fakeStore.updateProfile);
        assert.calledWith(fakeStore.updateProfile, {
          preferences: {},
        });
      });
    });
  });

  describe('#reload', () => {
    beforeEach(() => {
      // Load the initial profile data, as the client will do on startup.
      fakeApi.profile.read.returns(
        Promise.resolve({
          userid: 'acct:user_a@hypothes.is',
        })
      );
      const session = createService();
      return session.load();
    });

    it('should clear cached data and reload', () => {
      fakeApi.profile.read.returns(
        Promise.resolve({
          userid: 'acct:user_b@hypothes.is',
        })
      );

      fakeStore.updateProfile.resetHistory();

      const session = createService();
      return session.reload().then(() => {
        assert.calledOnce(fakeStore.updateProfile);
        assert.calledWith(fakeStore.updateProfile, {
          userid: 'acct:user_b@hypothes.is',
        });
      });
    });
  });

  describe('#logout', () => {
    const loggedOutProfile = {
      userid: null,

      // Dummy value used to differentiate this object from the default
      // value of `store.profile()`.
      isLoggedOutProfile: true,
    };

    beforeEach(() => {
      fakeApi.profile.read.resolves(loggedOutProfile);
    });

    it('logs the user out', () => {
      const session = createService();
      return session.logout().then(() => {
        assert.called(fakeAuth.logout);
      });
    });

    it('updates the profile after logging out', () => {
      const session = createService();
      return session.logout().then(() => {
        assert.calledOnce(fakeStore.updateProfile);
        assert.calledWith(fakeStore.updateProfile, loggedOutProfile);
      });
    });

    it('displays an error if logging out fails', async () => {
      fakeAuth.logout.rejects(new Error('Could not revoke token'));
      const session = createService();
      try {
        await session.logout();
      } catch (e) {
        // Ignored.
      }
      assert.calledWith(fakeToastMessenger.error, 'Log out failed');
    });
  });

  context('when another client changes the current login', () => {
    it('reloads the profile', () => {
      fakeApi.profile.read.returns(
        Promise.resolve({
          userid: 'acct:initial_user@hypothes.is',
        })
      );

      const session = createService();
      return session
        .load()
        .then(() => {
          // Simulate login change happening in a different tab.
          fakeApi.profile.read.returns(
            Promise.resolve({
              userid: 'acct:different_user@hypothes.is',
            })
          );
          fakeAuth.emit('oauthTokensChanged');

          fakeStore.updateProfile.resetHistory();
          return session.load();
        })
        .then(() => {
          assert.calledOnce(fakeStore.updateProfile);
          assert.calledWith(fakeStore.updateProfile, {
            userid: 'acct:different_user@hypothes.is',
          });
        });
    });
  });
});
