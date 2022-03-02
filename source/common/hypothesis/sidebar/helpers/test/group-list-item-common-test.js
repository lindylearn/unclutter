import * as groupListItemCommon from '../group-list-item-common';

describe('sidebar/helpers/group-list-item-common', () => {
  describe('orgName', () => {
    it('returns the organization name if it exists', () => {
      const fakeGroup = { id: 'groupid', organization: { name: 'org' } };

      const organizationName = groupListItemCommon.orgName(fakeGroup);
      assert.equal(organizationName, fakeGroup.organization.name);
    });

    it('returns undefined if group has no organization', () => {
      const fakeGroup = { id: 'groupid' };

      assert.isUndefined(groupListItemCommon.orgName(fakeGroup));
    });
  });
});
