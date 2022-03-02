import { mount } from 'enzyme';

import SidebarContentError from '../SidebarContentError';
import { $imports } from '../SidebarContentError';

import { checkAccessibility } from '../../../test-util/accessibility';
import mockImportedComponents from '../../../test-util/mock-imported-components';

describe('SidebarContentError', () => {
  let fakeStore;

  const createComponent = props => {
    return mount(
      <SidebarContentError
        errorType="annotation"
        onLoginRequest={sinon.stub()}
        {...props}
      />
    );
  };

  beforeEach(() => {
    fakeStore = {
      clearSelection: sinon.stub(),
      isLoggedIn: sinon.stub().returns(true),
    };
    $imports.$mock({
      '../store/use-store': { useStoreProxy: () => fakeStore },
    });
    $imports.$mock(mockImportedComponents());
  });

  afterEach(() => {
    $imports.$restore();
  });

  const findButtonByText = (wrapper, text) => {
    return wrapper
      .find('LabeledButton')
      .filterWhere(button => button.text() === text)
      .at(0);
  };

  it('should provide a button to clear the selection (show all annotations)', () => {
    const fakeOnLogin = sinon.stub();
    const wrapper = createComponent({
      onLoginRequest: fakeOnLogin,
      showClearSelection: true,
    });

    const clearButton = findButtonByText(wrapper, 'Show all annotations');

    assert.isTrue(clearButton.exists());

    clearButton.props().onClick();
    assert.called(fakeStore.clearSelection);
  });

  context('unavailable annotation, logged out', () => {
    it('should display error text about unavailable annotation', () => {
      fakeStore.isLoggedIn.returns(false);

      const wrapper = createComponent();

      assert.include(
        wrapper.text(),
        'The annotation associated with the current URL is unavailable'
      );
      assert.include(wrapper.text(), 'You may need to log in');
    });

    it('should render a log in button', () => {
      fakeStore.isLoggedIn.returns(false);
      const fakeOnLogin = sinon.stub();

      const wrapper = createComponent({ onLoginRequest: fakeOnLogin });
      const loginButton = findButtonByText(wrapper, 'Log in');

      assert.isTrue(loginButton.exists());
      assert.equal(loginButton.props().onClick, fakeOnLogin);
    });
  });

  context('unavailable annotation, logged in', () => {
    it('should display error text about unavailable annotation', () => {
      fakeStore.isLoggedIn.returns(true);

      const wrapper = createComponent();

      assert.include(
        wrapper.text(),
        'The current URL links to an annotation, but that annotation'
      );
      assert.notInclude(wrapper.text(), 'You may need to log in');
    });

    it('should not provide an option to log in', () => {
      fakeStore.isLoggedIn.returns(true);

      const wrapper = createComponent();
      const loginButton = findButtonByText(wrapper, 'Log in');

      assert.isFalse(loginButton.exists());
    });
  });

  context('unavailable group, logged out', () => {
    it('should display error text about unavailable group', () => {
      fakeStore.isLoggedIn.returns(false);

      const wrapper = createComponent({ errorType: 'group' });

      assert.include(
        wrapper.text(),
        'The group associated with the current URL is unavailable'
      );
      assert.include(wrapper.text(), 'You may need to log in');
    });

    it('should provide option to log in', () => {
      fakeStore.isLoggedIn.returns(false);

      const wrapper = createComponent({ errorType: 'group' });
      const loginButton = findButtonByText(wrapper, 'Log in');

      assert.isTrue(loginButton.exists());
    });
  });

  context('unavailable group, logged in', () => {
    it('should display error text about unavailable group', () => {
      fakeStore.isLoggedIn.returns(true);

      const wrapper = createComponent({ errorType: 'group' });

      assert.include(
        wrapper.text(),
        'The current URL links to a group, but that group'
      );
      assert.notInclude(wrapper.text(), 'You may need to log in');
    });

    it('should not provide an option to log in', () => {
      fakeStore.isLoggedIn.returns(true);

      const wrapper = createComponent({ errorType: 'group' });
      const loginButton = findButtonByText(wrapper, 'Log in');

      assert.isFalse(loginButton.exists());
    });
  });

  it(
    'should pass a11y checks',
    checkAccessibility([
      {
        name: 'logged out',
        content: () => {
          fakeStore.isLoggedIn.returns(false);
          return createComponent();
        },
      },
      {
        name: 'logged in',
        content: () => {
          return createComponent();
        },
      },
    ])
  );
});
