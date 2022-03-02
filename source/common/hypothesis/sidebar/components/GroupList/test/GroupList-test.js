import { mount } from 'enzyme';
import { act } from 'preact/test-utils';

import GroupList, { $imports } from '../GroupList';

import mockImportedComponents from '../../../../test-util/mock-imported-components';

describe('GroupList', () => {
  let fakeServiceConfig;
  let fakeSettings;
  let fakeStore;
  let testGroup;

  function createGroupList() {
    return mount(<GroupList settings={fakeSettings} />);
  }

  /**
   * Configure the store to populate all of the group sections.
   * Must be called before group list is rendered.
   */
  function populateGroupSections() {
    const testGroups = [
      {
        ...testGroup,
        id: 'zzz',
      },
      {
        ...testGroup,
        id: 'aaa',
      },
    ];
    fakeStore.getMyGroups.returns(testGroups);
    fakeStore.getCurrentlyViewingGroups.returns(testGroups);
    fakeStore.getFeaturedGroups.returns(testGroups);
    return testGroups;
  }

  beforeEach(() => {
    testGroup = {
      id: 'testgroup',
      name: 'Test group',
      organization: { id: 'testorg', name: 'Test Org' },
    };

    fakeSettings = {};
    fakeStore = {
      defaultAuthority: sinon.stub().returns('hypothes.is'),
      getCurrentlyViewingGroups: sinon.stub().returns([]),
      getFeaturedGroups: sinon.stub().returns([]),
      getLink: sinon.stub().returns(''),
      getMyGroups: sinon.stub().returns([]),
      focusedGroup: sinon.stub().returns(testGroup),
      profile: sinon.stub().returns({ userid: null }),
    };
    fakeServiceConfig = sinon.stub().returns(null);

    $imports.$mock(mockImportedComponents());
    $imports.$mock({
      '../../store/use-store': { useStoreProxy: () => fakeStore },
      '../../config/service-config': { serviceConfig: fakeServiceConfig },
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  it('displays descriptive menu title about which group is currently selected', () => {
    const wrapper = createGroupList();
    const menu = wrapper.find('Menu');

    assert.equal(menu.props().title, 'Select group (now viewing: Test group)');
  });

  it('adds descriptive label text if no currently-focused group', () => {
    fakeStore.focusedGroup.returns(undefined);
    const wrapper = createGroupList();
    const menu = wrapper.find('Menu');

    assert.equal(menu.props().title, 'Select group');
  });

  it('displays no sections if there are no groups', () => {
    const wrapper = createGroupList();
    assert.isFalse(wrapper.exists('GroupListSection'));
  });

  it('displays "Currently Viewing" section if there are currently viewing groups', () => {
    fakeStore.getCurrentlyViewingGroups.returns([testGroup]);
    const wrapper = createGroupList();
    assert.isTrue(
      wrapper.exists('GroupListSection[heading="Currently Viewing"]')
    );
  });

  it('displays "Featured Groups" section if there are featured groups', () => {
    fakeStore.getFeaturedGroups.returns([testGroup]);
    const wrapper = createGroupList();
    assert.isTrue(
      wrapper.exists('GroupListSection[heading="Featured Groups"]')
    );
  });

  it('displays "My Groups" section if user is a member of any groups', () => {
    fakeStore.getMyGroups.returns([testGroup]);
    const wrapper = createGroupList();
    assert.isTrue(wrapper.exists('GroupListSection[heading="My Groups"]'));
  });

  it('sorts groups within each section by organization', () => {
    const testGroups = populateGroupSections();
    const fakeGroupOrganizations = groups =>
      groups.sort((a, b) => a.id.localeCompare(b.id));
    $imports.$mock({
      '../../helpers/group-organizations': fakeGroupOrganizations,
    });

    const wrapper = createGroupList();
    const sections = wrapper.find('GroupListSection');

    assert.equal(sections.length, 3);
    sections.forEach(section => {
      assert.deepEqual(
        section.prop('groups'),
        fakeGroupOrganizations(testGroups)
      );
    });
  });

  [
    {
      userid: null,
      expectNewGroupButton: false,
    },
    {
      userid: 'acct:john@hypothes.is',
      expectNewGroupButton: true,
    },
    {
      userid: 'acct:john@otherpublisher.org',
      expectNewGroupButton: false,
    },
  ].forEach(({ userid, expectNewGroupButton }) => {
    it('displays "New private group" button if user is logged in with first-party account', () => {
      fakeStore.profile.returns({ userid });
      const wrapper = createGroupList();
      const newGroupButton = wrapper.find(
        'MenuItem[label="New private group"]'
      );
      assert.equal(newGroupButton.length, expectNewGroupButton ? 1 : 0);
    });
  });

  it('opens new window at correct URL when "New private group" is clicked', () => {
    fakeStore.getLink
      .withArgs('groups.new')
      .returns('https://example.com/groups/new');
    fakeStore.profile.returns({ userid: 'jsmith@hypothes.is' });
    const wrapper = createGroupList();
    const newGroupButton = wrapper.find('MenuItem[label="New private group"]');
    assert.equal(newGroupButton.props().href, 'https://example.com/groups/new');
  });

  context('when `isThirdPartyService` is true', () => {
    beforeEach(() => {
      $imports.$mock({
        '../../helpers/is-third-party-service': {
          isThirdPartyService: () => true,
        },
      });
    });

    it('displays the group name and icon as static text if there is only one group and no actions available', () => {
      const wrapper = createGroupList();
      assert.equal(wrapper.text(), 'Test group');
    });

    it('uses the organization name for the `alt` attribute', () => {
      fakeServiceConfig.returns({ icon: 'test-icon' });
      const wrapper = createGroupList();
      assert.equal(wrapper.find('img').prop('alt'), 'Test Org');
    });

    it('uses a blank string for the `alt` attribute if the organization name is missing', () => {
      fakeServiceConfig.returns({ icon: 'test-icon' });
      testGroup.organization = {};
      const wrapper = createGroupList();
      assert.equal(wrapper.find('img').prop('alt'), '');
    });
  });

  it('renders a placeholder if groups have not loaded yet', () => {
    fakeStore.focusedGroup.returns(null);
    const wrapper = createGroupList();
    const label = wrapper.find('Menu').prop('label');
    assert.equal(mount(label).text(), '…');
  });

  it('renders the publisher-provided icon in the toggle button', () => {
    fakeServiceConfig.returns({ icon: 'test-icon' });
    const wrapper = createGroupList();
    const label = wrapper.find('Menu').prop('label');
    const img = mount(label).find('img');
    assert.equal(img.prop('src'), 'test-icon');
  });

  it('does not render an icon if the the publisher-provided icon is missing', () => {
    const wrapper = createGroupList();
    const label = wrapper.find('Menu').prop('label');
    assert.isFalse(mount(label).find('img').exists());
  });

  /**
   * Assert that the submenu for a particular group is expanded (or none is
   * if `group` is `null`).
   */
  const verifyGroupIsExpanded = (wrapper, group) =>
    wrapper.find('GroupListSection').forEach(section => {
      assert.equal(section.prop('expandedGroup'), group);
    });

  it("sets or resets expanded group item when a group's submenu toggle is clicked", () => {
    const testGroups = populateGroupSections();

    // Render group list. Initially no submenu should be expanded.
    const wrapper = createGroupList();
    verifyGroupIsExpanded(wrapper, null);

    // Expand a group in one of the sections.
    act(() => {
      wrapper.find('GroupListSection').first().prop('onExpandGroup')(
        testGroups[0]
      );
    });
    wrapper.update();
    verifyGroupIsExpanded(wrapper, testGroups[0]);

    // Reset expanded group.
    act(() => {
      wrapper.find('GroupListSection').first().prop('onExpandGroup')(null);
    });
    wrapper.update();
    verifyGroupIsExpanded(wrapper, null);
  });

  it('resets expanded group when menu is closed', () => {
    const testGroups = populateGroupSections();
    const wrapper = createGroupList();

    // Expand one of the submenus.
    act(() => {
      wrapper.find('GroupListSection').first().prop('onExpandGroup')(
        testGroups[0]
      );
    });
    wrapper.update();
    verifyGroupIsExpanded(wrapper, testGroups[0]);

    // Close the menu
    act(() => {
      wrapper.find('Menu').prop('onOpenChanged')(false);
    });
    wrapper.update();
    verifyGroupIsExpanded(wrapper, null);
  });
});
