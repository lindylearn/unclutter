import * as orgFixtures from '../../test/group-fixtures';
import groupsByOrganization from '../group-organizations';

describe('sidebar/helpers/group-organizations', () => {
  context('when sorting organizations and their contained groups', () => {
    it('should put the default organization groups last', () => {
      const defaultOrg = orgFixtures.defaultOrganization();
      const groups = [
        orgFixtures.expandedGroup({ organization: defaultOrg }),
        orgFixtures.expandedGroup(),
        orgFixtures.expandedGroup(),
      ];

      const sortedGroups = groupsByOrganization(groups);

      assert.equal(sortedGroups[2].organization.id, defaultOrg.id);
    });

    it('should sort organizations by name', () => {
      const org1 = orgFixtures.organization({ name: 'zzzzz' });
      const org2 = orgFixtures.organization({ name: 'aaaaa' });
      const org3 = orgFixtures.organization({ name: 'yyyyy' });
      const groups = [
        orgFixtures.expandedGroup({ organization: org1 }),
        orgFixtures.expandedGroup({ organization: org2 }),
        orgFixtures.expandedGroup({ organization: org3 }),
      ];

      const sortedGroups = groupsByOrganization(groups);

      assert.equal(sortedGroups[0].organization.name, 'aaaaa');
      assert.equal(sortedGroups[1].organization.name, 'yyyyy');
      assert.equal(sortedGroups[2].organization.name, 'zzzzz');
    });

    it('should sort organizations secondarily by id', () => {
      const org1 = orgFixtures.organization({ name: 'zzzzz', id: 'zzzzz' });
      const org2 = orgFixtures.organization({ name: 'zzzzz', id: 'aaaaa' });
      const org3 = orgFixtures.organization({ name: 'zzzzz', id: 'yyyyy' });
      const groups = [
        orgFixtures.expandedGroup({ organization: org1 }),
        orgFixtures.expandedGroup({ organization: org2 }),
        orgFixtures.expandedGroup({ organization: org3 }),
      ];

      const sortedGroups = groupsByOrganization(groups);

      assert.equal(sortedGroups[0].organization.id, 'aaaaa');
      assert.equal(sortedGroups[1].organization.id, 'yyyyy');
      assert.equal(sortedGroups[2].organization.id, 'zzzzz');
    });

    it('should only include logo for first group in each organization', () => {
      const org = orgFixtures.organization({ name: 'Aluminum' });
      const org2 = orgFixtures.organization({ name: 'Zirconium' });
      const groups = [
        { name: 'Aluminum', organization: org },
        { name: 'Beryllium', organization: org2 },
        { name: 'Butane', organization: org2 },
        { name: 'Cadmium', organization: org },
      ];

      const sortedGroups = groupsByOrganization(groups);

      assert.equal(sortedGroups[0].logo, org.logo);
      assert.equal(typeof sortedGroups[1].logo, 'undefined');
      assert.equal(sortedGroups[2].logo, org2.logo);
      assert.equal(typeof sortedGroups[3].logo, 'undefined');
    });
  });

  context('when encountering missing data', () => {
    it('should be able to sort without any groups in the default org', () => {
      const org = orgFixtures.organization({ name: 'Aluminum' });
      const groups = [
        { name: 'Aluminum', organization: org },
        { name: 'Beryllium', organization: org },
        { name: 'Cadmium', organization: org },
      ];

      const sortedGroups = groupsByOrganization(groups);

      sortedGroups.forEach((group, idx) => {
        assert.equal(group.name, groups[idx].name);
      });
    });

    it('should omit any groups without an organization', () => {
      const org = orgFixtures.organization({ name: 'Europium' });
      const groups = [
        { name: 'Aluminum', organization: org },
        { name: 'Beryllium', organization: org },
        { name: 'Butane' },
        { name: 'Cadmium', organization: org },
      ];

      const sortedGroups = groupsByOrganization(groups);

      assert.equal(sortedGroups.length, groups.length - 1);
      sortedGroups.forEach(group => {
        assert.notEqual(group.name, 'Butane');
      });
    });

    it('should omit any groups with unexpanded organizations', () => {
      const org = orgFixtures.organization({ name: 'Europium' });
      const groups = [
        { name: 'Aluminum', organization: org },
        { name: 'Beryllium', organization: org },
        { name: 'Butane', organization: 'foobar' },
        { name: 'Cadmium', organization: org },
      ];

      const sortedGroups = groupsByOrganization(groups);

      assert.equal(sortedGroups.length, groups.length - 1);
      sortedGroups.forEach(group => {
        assert.notEqual(group.name, 'Butane');
      });
    });

    it('should omit logo property if not present on organization', () => {
      const org = orgFixtures.organization({ logo: undefined });
      const org2 = orgFixtures.organization({ logo: null });
      const groups = [
        { name: 'Aluminum', organization: org },
        { name: 'Beryllium', organization: org2 },
        { name: 'Butane', organization: org2 },
        { name: 'Cadmium', organization: org },
      ];

      const sortedGroups = groupsByOrganization(groups);

      sortedGroups.forEach(group => {
        assert.equal(typeof group.logo, 'undefined');
      });
    });
  });

  context('when building data structures', () => {
    it('returned group objects should be immutable', () => {
      const group = orgFixtures.expandedGroup({ name: 'Halfnium' });
      const groups = [group];

      const sortedGroups = groupsByOrganization(groups);
      assert.throws(() => {
        sortedGroups[0].name = 'Something Else';
      });
      assert.throws(() => {
        sortedGroups[0].links.html = 'dingdong';
      });

      assert.notEqual(group.name, 'Something Else');
      assert.notEqual(group.links.html, 'dingdong');
    });
  });
});
