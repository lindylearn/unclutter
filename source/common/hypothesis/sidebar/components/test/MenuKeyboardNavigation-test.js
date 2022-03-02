import { mount } from 'enzyme';

import MenuKeyboardNavigation from '../MenuKeyboardNavigation';
import { $imports } from '../MenuKeyboardNavigation';

import { checkAccessibility } from '../../../test-util/accessibility';
import mockImportedComponents from '../../../test-util/mock-imported-components';

describe('MenuKeyboardNavigation', () => {
  let fakeCloseMenu;
  let clock;
  let containers = [];

  const createMenuItem = props => {
    let newContainer = document.createElement('div');
    containers.push(newContainer);
    document.body.appendChild(newContainer);
    return mount(
      <MenuKeyboardNavigation
        closeMenu={fakeCloseMenu}
        className="test-nav"
        {...props}
      >
        <button>Item 0</button>
        <button role="menuitem">Item 1</button>
        <button role="menuitem">Item 2</button>
        <button role="menuitem">Item 3</button>
      </MenuKeyboardNavigation>,
      {
        attachTo: newContainer,
      }
    );
  };

  beforeEach(() => {
    fakeCloseMenu = sinon.stub();
    $imports.$mock(mockImportedComponents());
  });

  afterEach(() => {
    $imports.$restore();
    containers.forEach(container => {
      container.remove();
    });
    containers = [];
  });

  it('renders the provided class name', () => {
    const wrapper = createMenuItem({ className: 'test' });
    assert.isTrue(wrapper.find('.test').exists());
  });

  ['ArrowLeft', 'Escape'].forEach(key => {
    it(`calls \`closeMenu\` callback when the '${key}' is pressed`, () => {
      const wrapper = createMenuItem({ visible: true }).find('div.test-nav');
      wrapper.simulate('keydown', { key });
      assert.called(fakeCloseMenu);
    });
  });

  // useFakeTimers does not work with checkAccessibility
  // so wrap these tests in their own describe block
  describe('keyboard navigation', () => {
    beforeEach(() => {
      clock = sinon.useFakeTimers();
    });

    afterEach(() => {
      clock.restore();
    });

    it('sets focus to the first `menuitem` child when `visible` is true', () => {
      const clock = sinon.useFakeTimers();
      createMenuItem({ visible: true });
      clock.tick(1);
      assert.equal(document.activeElement.innerText, 'Item 1');
    });

    it('changes focus circularly when down arrow is pressed', () => {
      const wrapper = createMenuItem({ visible: true }).find('div.test-nav');
      clock.tick(1);
      wrapper.simulate('keydown', { key: 'ArrowDown' });
      assert.equal(document.activeElement.innerText, 'Item 2');
      wrapper.simulate('keydown', { key: 'ArrowDown' });
      assert.equal(document.activeElement.innerText, 'Item 3');
      wrapper.simulate('keydown', { key: 'ArrowDown' });
      assert.equal(document.activeElement.innerText, 'Item 1');
    });

    it('changes focus circularly when up arrow is pressed', () => {
      const wrapper = createMenuItem({ visible: true }).find('div.test-nav');
      clock.tick(1);
      wrapper.simulate('keydown', { key: 'ArrowUp' });
      assert.equal(document.activeElement.innerText, 'Item 3');
      wrapper.simulate('keydown', { key: 'ArrowUp' });
      assert.equal(document.activeElement.innerText, 'Item 2');
      wrapper.simulate('keydown', { key: 'ArrowUp' });
      assert.equal(document.activeElement.innerText, 'Item 1');
    });

    it('changes focus to the last item when up `End` is pressed', () => {
      const wrapper = createMenuItem({ visible: true }).find('div.test-nav');
      clock.tick(1);
      wrapper.simulate('keydown', { key: 'End' });
      assert.equal(document.activeElement.innerText, 'Item 3');
    });

    it('changes focus to the first item when up `Home` is pressed', () => {
      const wrapper = createMenuItem({ visible: true }).find('div.test-nav');
      clock.tick(1);
      wrapper.simulate('keydown', { key: 'End' }); // move focus off first item
      wrapper.simulate('keydown', { key: 'Home' });
      assert.equal(document.activeElement.innerText, 'Item 1');
    });

    it('does not throw an error when unmounting the component before the focus timeout finishes', () => {
      const wrapper = createMenuItem({ visible: true });
      wrapper.unmount();
      clock.tick(1);
      // no assert needed
    });
  });

  it(
    'should pass a11y checks',
    checkAccessibility({
      // eslint-disable-next-line react/display-name
      content: () => (
        <div>
          <MenuKeyboardNavigation>
            <button role="menuitem">Item 1</button>
          </MenuKeyboardNavigation>
        </div>
      ),
    })
  );
});
