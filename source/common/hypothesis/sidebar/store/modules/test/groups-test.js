import { createStore } from '../../create-store';
import groups from '../groups';
import session from '../session';
import immutable from '../../../util/immutable';

describe('sidebar/store/modules/groups', () => {
  const publicGroup = immutable({
    id: '__world__',
    name: 'Public',
    isMember: true,
    isScopedToUri: true,
  });

  const privateGroup = immutable({
    id: 'privateid',
    name: 'Private',
    isMember: true,
    isScopedToUri: true,
  });

  const restrictedGroup = immutable({
    id: 'restrictid',
    name: 'Restricted',
    isMember: false,
    isScopedToUri: true,
  });

  const restrictedOutOfScopeGroup = immutable({
    id: 'rstrctdOOSid',
    name: 'Restricted OOS',
    isMember: false,
    isScopedToUri: false,
  });

  const restrictedOutOfScopeMemberGroup = immutable({
    id: 'rstrctdOOSmemberid',
    name: 'Restricted OOS Mem',
    isMember: true,
    isScopedToUri: false,
  });

  const openGroup = immutable({
    id: 'openid',
    isMember: false,
    isScopedToUri: true,
  });

  /*
   * Returns groups from the specified group list in the store and asserts
   * that none of the lists contain the same groups. The group lists are:
   * myGroups, featuredGroups, or currentlyViewingGroups.
   */
  const getListAssertNoDupes = (store, list) => {
    const allLists = {
      myGroups: store.getMyGroups(),
      featuredGroups: store.getFeaturedGroups(),
      currentlyViewingGroups: store.getCurrentlyViewingGroups(),
    };

    let allGroups = [];
    for (let groups of Object.values(allLists)) {
      allGroups = allGroups.concat(groups);
    }

    const hasDuplicates = new Set(allGroups).size !== allGroups.length;
    assert.isFalse(hasDuplicates);

    return allLists[list];
  };

  let store;

  beforeEach(() => {
    // The empty second argument (settings) needed here because of the
    // dependency on the `session` module
    store = createStore([groups, session], [{}]);
  });

  describe('focusGroup', () => {
    beforeEach(() => {
      sinon.stub(console, 'error');
    });

    afterEach(() => {
      console.error.restore();
    });

    it('updates the focused group if valid', () => {
      store.loadGroups([publicGroup]);

      store.focusGroup(publicGroup.id);

      assert.equal(store.getState().groups.focusedGroupId, publicGroup.id);
      assert.notCalled(console.error);
    });

    it('does not update focused group if not valid', () => {
      store.loadGroups([publicGroup]);

      store.focusGroup(privateGroup.id);

      assert.equal(store.getState().groups.focusedGroupId, publicGroup.id);
      assert.called(console.error);
    });
  });

  describe('loadGroups', () => {
    it('updates the set of groups', () => {
      store.loadGroups([publicGroup]);
      assert.deepEqual(store.getState().groups.groups, [publicGroup]);
    });

    it('resets the focused group if not in new set of groups', () => {
      store.loadGroups([publicGroup]);
      store.focusGroup(publicGroup.id);
      store.loadGroups([]);

      assert.equal(store.getState().groups.focusedGroupId, null);
    });

    it('leaves focused group unchanged if in new set of groups', () => {
      store.loadGroups([publicGroup]);
      store.focusGroup(publicGroup.id);
      store.loadGroups([publicGroup, privateGroup]);

      assert.equal(store.getState().groups.focusedGroupId, publicGroup.id);
    });
  });

  describe('clearGroups', () => {
    it('clears the list of groups', () => {
      store.loadGroups([publicGroup]);

      store.clearGroups();

      assert.equal(store.getState().groups.groups.length, 0);
    });

    it('clears the focused group id', () => {
      store.loadGroups([publicGroup]);
      store.focusGroup(publicGroup.id);

      store.clearGroups();

      assert.equal(store.getState().groups.focusedGroupId, null);
    });
  });

  describe('allGroups', () => {
    it('returns all groups', () => {
      store.loadGroups([publicGroup, privateGroup]);
      assert.deepEqual(store.allGroups(), [publicGroup, privateGroup]);
    });
  });

  describe('getInScopeGroups', () => {
    it('returns all groups that are in scope', () => {
      store.loadGroups([publicGroup, privateGroup, restrictedOutOfScopeGroup]);
      assert.deepEqual(store.getInScopeGroups(), [publicGroup, privateGroup]);
    });
  });

  describe('getGroup', () => {
    it('returns the group with the given ID', () => {
      store.loadGroups([publicGroup, privateGroup]);
      assert.deepEqual(store.getGroup(privateGroup.id), privateGroup);
    });
  });

  describe('focusedGroup', () => {
    it('returns `null` if no group is focused', () => {
      assert.equal(store.focusedGroup(), null);
    });

    it('returns the focused group if a group has been focused', () => {
      store.loadGroups([privateGroup]);
      store.focusGroup(privateGroup.id);
      assert.deepEqual(store.focusedGroup(), privateGroup);
    });
  });

  describe('focusedGroupId', () => {
    it('returns `null` if no group is focused', () => {
      assert.equal(store.focusedGroupId(), null);
    });

    it('returns the focused group ID if a group has been focused', () => {
      store.loadGroups([privateGroup]);
      store.focusGroup(privateGroup.id);
      assert.equal(store.focusedGroupId(), privateGroup.id);
    });
  });

  describe('getFeaturedGroups', () => {
    [
      {
        description:
          'If logged in and there is a restricted group the user is not a member of, show it in `Featured Groups`.',
        isLoggedIn: true,
        allGroups: [restrictedGroup],
        expectedFeaturedGroups: [restrictedGroup],
      },
      {
        description:
          'If logged in and there is an open group, show it in `Featured Groups`.',
        isLoggedIn: true,
        allGroups: [openGroup],
        expectedFeaturedGroups: [openGroup],
      },
      {
        description:
          'If logged in and the user is a member of all the groups, do not show them in `Featured Groups`.',
        isLoggedIn: true,
        allGroups: [publicGroup],
        expectedFeaturedGroups: [],
      },
      {
        description:
          'If logged out and there is an in-scope restricted group, show it in `Featured Groups`.',
        isLoggedIn: false,
        allGroups: [restrictedGroup],
        expectedFeaturedGroups: [restrictedGroup],
      },
      {
        description:
          'If logged out and there is an open group, show it in `Featured Groups`.',
        isLoggedIn: false,
        allGroups: [openGroup],
        expectedFeaturedGroups: [openGroup],
      },
    ].forEach(
      ({ description, isLoggedIn, allGroups, expectedFeaturedGroups }) => {
        it(description, () => {
          store.updateProfile({ userid: isLoggedIn ? '1234' : null });
          store.loadGroups(allGroups);
          const featuredGroups = getListAssertNoDupes(store, 'featuredGroups');
          assert.deepEqual(featuredGroups, expectedFeaturedGroups);
        });
      }
    );
  });

  describe('getMyGroups', () => {
    [
      {
        description: 'If not logged in, do not show groups in `My Groups`',
        isLoggedIn: false,
        allGroups: [publicGroup],
        expectedMyGroups: [],
      },
      {
        description:
          'If logged in and the user is a member of the group, show it in `My Groups`',
        isLoggedIn: true,
        allGroups: [openGroup],
        expectedMyGroups: [],
      },
      {
        description:
          'If logged in and the user is a member of the unscoped group, show it in `My Groups`',
        isLoggedIn: true,
        allGroups: [restrictedOutOfScopeMemberGroup],
        expectedMyGroups: [restrictedOutOfScopeMemberGroup],
      },
      {
        description:
          'If logged in and the user is a member of the group, show it in `My Groups`',
        isLoggedIn: true,
        allGroups: [publicGroup],
        expectedMyGroups: [publicGroup],
      },
    ].forEach(({ description, isLoggedIn, allGroups, expectedMyGroups }) => {
      it(description, () => {
        store.updateProfile({ userid: isLoggedIn ? '1234' : null });
        store.loadGroups(allGroups);

        const myGroups = getListAssertNoDupes(store, 'myGroups');

        assert.deepEqual(myGroups, expectedMyGroups);
      });
    });
  });

  describe('getCurrentlyViewingGroups', () => {
    [
      {
        description:
          'If logged out and there is an out-of-scope restricted group, show it in `Currently Viewing`',
        isLoggedIn: false,
        allGroups: [restrictedOutOfScopeGroup],
      },
      {
        description:
          'If logged out and only the Public group is present, show it in `Currently Viewing`',
        isLoggedIn: false,
        allGroups: [publicGroup],
      },
      {
        description:
          'If logged in and there is an out-of-scope restricted group that the user is not a memberof, show it in `Currently Viewing`',
        isLoggedIn: true,
        allGroups: [restrictedOutOfScopeGroup],
      },
    ].forEach(({ description, isLoggedIn, allGroups }) => {
      it(description, () => {
        store.updateProfile({ userid: isLoggedIn ? '1234' : null });
        store.loadGroups(allGroups);

        const currentlyViewing = getListAssertNoDupes(
          store,
          'currentlyViewingGroups'
        );

        assert.deepEqual(currentlyViewing, allGroups);
      });
    });
  });
});
