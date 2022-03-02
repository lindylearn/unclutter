import { createStore } from '../../create-store';
import session from '../session';

describe('sidebar/store/modules/session', () => {
  let fakeSettings;
  let store;

  beforeEach(() => {
    fakeSettings = {};
    store = createStore([session], [fakeSettings]);
  });

  describe('#updateProfile', () => {
    it('updates the profile data', () => {
      const newProfile = Object.assign({ userid: 'john' });
      store.updateProfile({ userid: 'john' });
      assert.deepEqual(store.profile(), newProfile);
    });
  });

  describe('#defaultAuthority', () => {
    it('returns the default authority from the settings', () => {
      fakeSettings.authDomain = 'foo.com';
      store = createStore([session], [fakeSettings]);

      assert.equal(store.defaultAuthority(), 'foo.com');
    });
  });

  describe('#isLoggedIn', () => {
    [
      { userid: 'john', expectedIsLoggedIn: true },
      { userid: null, expectedIsLoggedIn: false },
    ].forEach(({ userid, expectedIsLoggedIn }) => {
      it('returns whether the user is logged in', () => {
        store.updateProfile({ userid });
        assert.equal(store.isLoggedIn(), expectedIsLoggedIn);
      });
    });
  });

  describe('#isFeatureEnabled', () => {
    it('returns false before features have been fetched', () => {
      assert.isFalse(store.isFeatureEnabled('some_feature'));
    });

    it('returns false if feature is unknown', () => {
      store.updateProfile({ userid: null, features: {} });
      assert.isFalse(store.isFeatureEnabled('some_feature'));
    });

    [true, false].forEach(enabled => {
      it('returns feature flag state if profile is fetched and feature exists', () => {
        store.updateProfile({
          userid: null,
          features: { some_feature: enabled },
        });
        assert.equal(store.isFeatureEnabled('some_feature'), enabled);
      });
    });
  });

  describe('#hasFetchedProfile', () => {
    it('returns false before profile is updated', () => {
      assert.isFalse(store.hasFetchedProfile());
    });

    it('returns true after profile is updated', () => {
      store.updateProfile({ userid: 'john' });
      assert.isTrue(store.hasFetchedProfile());
    });
  });

  describe('#profile', () => {
    it("returns the user's profile", () => {
      store.updateProfile({ userid: 'john' });
      assert.deepEqual(store.profile(), {
        userid: 'john',
      });
    });
  });
});
