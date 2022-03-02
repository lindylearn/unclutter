import * as permissions from '../permissions';

const userid = 'acct:flash@gord.on';

describe('sidebar/helpers/permissions', () => {
  describe('#privatePermissions', () => {
    it('only allows the user to read the annotation', () => {
      assert.deepEqual(permissions.privatePermissions(userid), {
        read: [userid],
        update: [userid],
        delete: [userid],
      });
    });
  });

  describe('#sharedPermissions', () => {
    it('allows the group to read the annotation', () => {
      assert.deepEqual(permissions.sharedPermissions(userid, 'gid'), {
        read: ['group:gid'],
        update: [userid],
        delete: [userid],
      });
    });
  });

  describe('#defaultPermissions', () => {
    it('returns shared permissions by default', () => {
      assert.deepEqual(
        permissions.defaultPermissions(userid, 'gid'),
        permissions.sharedPermissions(userid, 'gid'),
        null
      );
    });

    it('returns private permissions if the saved level is "private"', () => {
      assert.deepEqual(
        permissions.defaultPermissions(userid, 'gid', 'private'),
        permissions.privatePermissions(userid)
      );
    });

    it('returns shared permissions if the saved level is "private" but no `userid`', () => {
      // FIXME: This test is necessary for the patch fix to prevent the "split-null" bug
      // https://github.com/hypothesis/client/issues/1221 but should be removed when the
      // code is refactored.
      assert.deepEqual(
        permissions.defaultPermissions(undefined, 'gid', 'private'),
        permissions.sharedPermissions(undefined, 'gid')
      );
    });

    it('returns shared permissions if the saved level is "shared"', () => {
      assert.deepEqual(
        permissions.defaultPermissions(userid, 'gid', 'shared'),
        permissions.sharedPermissions(userid, 'gid')
      );
    });
  });

  describe('#isShared', () => {
    it('returns true if a group can read the annotation', () => {
      const perms = permissions.sharedPermissions(userid, 'gid');
      assert.isTrue(permissions.isShared(perms));
    });

    it('returns false if only specific users can read the annotation', () => {
      const perms = permissions.privatePermissions(userid);
      assert.isFalse(permissions.isShared(perms));
    });
  });

  describe('#isPrivate', () => {
    it('returns true if only specific users can read the annotation', () => {
      const perms = permissions.privatePermissions(userid);
      assert.isTrue(permissions.isPrivate(perms));
    });

    it('returns false if a group can read the annotation', () => {
      const perms = permissions.sharedPermissions(userid, 'gid');
      assert.isFalse(permissions.isPrivate(perms));
    });
  });

  describe('#permits', () => {
    it('returns true if the user can perform the indicated action', () => {
      const perms = permissions.privatePermissions(userid);
      assert.isTrue(permissions.permits(perms, 'update', userid));
      assert.isTrue(permissions.permits(perms, 'delete', userid));
    });

    it('returns false if the user cannot perform the action', () => {
      const perms = permissions.privatePermissions('acct:not.flash@gord.on');
      assert.isFalse(permissions.permits(perms, 'update', userid));
      assert.isFalse(permissions.permits(perms, 'delete', userid));
    });

    it('returns false if the userid is null', () => {
      const perms = permissions.privatePermissions(userid);
      assert.isFalse(permissions.permits(perms, 'update', null));
    });
  });
});
