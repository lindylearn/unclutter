import { mount } from 'enzyme';
import { act } from 'preact/test-utils';

import bridgeEvents from '../../../shared/bridge-events';
import UserMenu from '../UserMenu';
import { $imports } from '../UserMenu';

import mockImportedComponents from '../../../test-util/mock-imported-components';

describe('UserMenu', () => {
  let fakeAuth;
  let fakeBridge;
  let fakeIsThirdPartyUser;
  let fakeOnLogout;
  let fakeServiceConfig;
  let fakeSettings;
  let fakeStore;

  const createUserMenu = () => {
    return mount(
      <UserMenu
        auth={fakeAuth}
        bridge={fakeBridge}
        onLogout={fakeOnLogout}
        settings={fakeSettings}
      />
    );
  };

  const findMenuItem = (wrapper, labelText) => {
    return wrapper
      .find('MenuItem')
      .filterWhere(n => n.prop('label') === labelText);
  };

  beforeEach(() => {
    fakeAuth = {
      displayName: 'Eleanor Fishtail',
      status: 'logged-in',
      userid: 'acct:eleanorFishtail@hypothes.is',
      username: 'eleanorFishy',
    };
    fakeBridge = { call: sinon.stub() };
    fakeIsThirdPartyUser = sinon.stub();
    fakeOnLogout = sinon.stub();
    fakeServiceConfig = sinon.stub();
    fakeSettings = {};
    fakeStore = {
      defaultAuthority: sinon.stub().returns('hypothes.is'),
      focusedGroupId: sinon.stub().returns('mygroup'),
      getLink: sinon.stub(),
      isFeatureEnabled: sinon.stub().returns(false),
    };

    $imports.$mock(mockImportedComponents());
    $imports.$mock({
      '../helpers/account-id': {
        isThirdPartyUser: fakeIsThirdPartyUser,
      },
      '../config/service-config': { serviceConfig: fakeServiceConfig },
      '../store/use-store': { useStoreProxy: () => fakeStore },
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  describe('profile menu item', () => {
    context('first-party user', () => {
      beforeEach(() => {
        fakeIsThirdPartyUser.returns(false);
        fakeStore.getLink.returns('profile-link');
      });

      it('should be enabled', () => {
        const wrapper = createUserMenu();

        const profileMenuItem = findMenuItem(wrapper, fakeAuth.displayName);
        assert.notOk(profileMenuItem.prop('isDisabled'));
      });

      it('should have a link (href)', () => {
        const wrapper = createUserMenu();

        const profileMenuItem = findMenuItem(wrapper, fakeAuth.displayName);
        assert.equal(profileMenuItem.prop('href'), 'profile-link');
      });

      it('should have a callback', () => {
        const wrapper = createUserMenu();

        const profileMenuItem = findMenuItem(wrapper, fakeAuth.displayName);
        assert.isFunction(profileMenuItem.prop('onClick'));
      });
    });

    context('third-party user', () => {
      beforeEach(() => {
        fakeIsThirdPartyUser.returns(true);
      });

      it('should be disabled if no service configured', () => {
        fakeServiceConfig.returns(null);

        const wrapper = createUserMenu();

        const profileMenuItem = findMenuItem(wrapper, fakeAuth.displayName);
        assert.isTrue(profileMenuItem.prop('isDisabled'));
      });

      it('should be disabled if service feature not supported', () => {
        fakeServiceConfig.returns({ onProfileRequestProvided: false });

        const wrapper = createUserMenu();

        const profileMenuItem = findMenuItem(wrapper, fakeAuth.displayName);
        assert.isTrue(profileMenuItem.prop('isDisabled'));
      });

      it('should be enabled if service feature support', () => {
        fakeServiceConfig.returns({ onProfileRequestProvided: true });

        const wrapper = createUserMenu();

        const profileMenuItem = findMenuItem(wrapper, fakeAuth.displayName);
        assert.notOk(profileMenuItem.prop('isDisabled'));
      });

      it('should have a callback if enabled', () => {
        fakeServiceConfig.returns({ onProfileRequestProvided: true });

        const wrapper = createUserMenu();

        const profileMenuItem = findMenuItem(wrapper, fakeAuth.displayName);
        assert.isFunction(profileMenuItem.prop('onClick'));
      });
    });

    describe('profile-selected callback', () => {
      it('should fire profile event for third-party user', () => {
        fakeServiceConfig.returns({ onProfileRequestProvided: true });
        fakeIsThirdPartyUser.returns(true);
        const wrapper = createUserMenu();
        const profileMenuItem = findMenuItem(wrapper, fakeAuth.displayName);
        const onProfileSelected = profileMenuItem.prop('onClick');

        onProfileSelected();

        assert.equal(fakeBridge.call.callCount, 1);
        assert.calledWith(fakeBridge.call, bridgeEvents.PROFILE_REQUESTED);
      });

      it('should not fire profile event for first-party user', () => {
        fakeIsThirdPartyUser.returns(false);
        const wrapper = createUserMenu();
        const profileMenuItem = findMenuItem(wrapper, fakeAuth.displayName);
        const onProfileSelected = profileMenuItem.prop('onClick');

        onProfileSelected();

        assert.equal(fakeBridge.call.callCount, 0);
      });
    });
  });

  describe('account settings menu item', () => {
    it('should be present if first-party user', () => {
      fakeIsThirdPartyUser.returns(false);

      const wrapper = createUserMenu();

      const accountMenuItem = findMenuItem(wrapper, 'Account settings');
      assert.isTrue(accountMenuItem.exists());
      assert.calledWith(fakeStore.getLink, 'account.settings');
    });

    it('should not be present if third-party user', () => {
      fakeIsThirdPartyUser.returns(true);

      const wrapper = createUserMenu();

      const accountMenuItem = findMenuItem(wrapper, 'Account settings');
      assert.isFalse(accountMenuItem.exists());
    });
  });

  describe('open notebook item', () => {
    context('notebook feature is enabled', () => {
      it('includes the open notebook item', () => {
        fakeStore.isFeatureEnabled.withArgs('notebook_launch').returns(true);
        const wrapper = createUserMenu();

        const openNotebookItem = findMenuItem(wrapper, 'Open notebook');
        assert.isTrue(openNotebookItem.exists());
      });

      it('triggers a message when open-notebook item is clicked', () => {
        fakeStore.isFeatureEnabled.withArgs('notebook_launch').returns(true);
        const wrapper = createUserMenu();

        const openNotebookItem = findMenuItem(wrapper, 'Open notebook');
        openNotebookItem.props().onClick();
        assert.calledOnce(fakeBridge.call);
        assert.calledWith(fakeBridge.call, 'openNotebook', 'mygroup');
      });

      it('opens the notebook and closes itself when `n` is typed', () => {
        const wrapper = createUserMenu();
        // Make the menu "open"
        act(() => {
          wrapper.find('Menu').props().onOpenChanged(true);
        });
        wrapper.update();
        assert.isTrue(wrapper.find('Menu').props().open);

        wrapper.find('.UserMenu').simulate('keydown', { key: 'n' });
        assert.calledOnce(fakeBridge.call);
        assert.calledWith(fakeBridge.call, 'openNotebook', 'mygroup');
        // Now the menu is "closed" again
        assert.isFalse(wrapper.find('Menu').props().open);
      });
    });

    context('notebook feature is not enabled', () => {
      it('does not include the open notebook item', () => {
        fakeStore.isFeatureEnabled.withArgs('notebook_launch').returns(false);
        const wrapper = createUserMenu();

        const openNotebookItem = findMenuItem(wrapper, 'Open notebook');
        assert.isFalse(openNotebookItem.exists());
      });
    });
  });

  describe('log out menu item', () => {
    const tests = [
      {
        it: 'should be present for first-party user if no service configured',
        isThirdParty: false,
        serviceConfigReturns: null,
        expected: true,
      },
      {
        it: 'should be present for first-party user if service supports `onLogoutRequest`',
        isThirdParty: false,
        serviceConfigReturns: { onLogoutRequestProvided: true },
        expected: true,
      },
      {
        it: 'should be present for first-party user if service does not support `onLogoutRequest`',
        isThirdParty: false,
        serviceConfigReturns: { onLogoutRequestProvided: false },
        expected: true,
      },
      {
        it: 'should be absent for third-party user if no service configured',
        isThirdParty: true,
        serviceConfigReturns: null,
        expected: false,
      },
      {
        it: 'should be present for third-party user if service supports `onLogoutRequest`',
        isThirdParty: true,
        serviceConfigReturns: { onLogoutRequestProvided: true },
        expected: true,
      },
      {
        it: 'should be absent for third-party user if `onLogoutRequest` not supported',
        isThirdParty: true,
        serviceConfigReturns: { onLogoutRequestProvided: false },
        expected: false,
      },
    ];

    tests.forEach(test => {
      it(test.it, () => {
        fakeIsThirdPartyUser.returns(test.isThirdParty);
        fakeServiceConfig.returns(test.serviceConfigReturns);

        const wrapper = createUserMenu();

        const logOutMenuItem = findMenuItem(wrapper, 'Log out');
        assert.equal(logOutMenuItem.exists(), test.expected);
        if (test.expected) {
          assert.equal(logOutMenuItem.prop('onClick'), fakeOnLogout);
        }
      });
    });
  });
});
