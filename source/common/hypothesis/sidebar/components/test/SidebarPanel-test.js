import { mount } from 'enzyme';

import SidebarPanel from '../SidebarPanel';
import { $imports } from '../SidebarPanel';

import { checkAccessibility } from '../../../test-util/accessibility';
import mockImportedComponents from '../../../test-util/mock-imported-components';

describe('SidebarPanel', () => {
  let fakeStore;
  let fakeScrollIntoView;

  const createSidebarPanel = props =>
    mount(<SidebarPanel panelName="testpanel" title="Test Panel" {...props} />);

  beforeEach(() => {
    fakeScrollIntoView = sinon.stub();

    fakeStore = {
      isSidebarPanelOpen: sinon.stub().returns(false),
      toggleSidebarPanel: sinon.stub(),
    };

    $imports.$mock(mockImportedComponents());
    $imports.$mock({
      '../store/use-store': { useStoreProxy: () => fakeStore },
      'scroll-into-view': fakeScrollIntoView,
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  it('renders a panel with provided title and icon', () => {
    const wrapper = createSidebarPanel({
      title: 'My Panel',
      icon: 'restricted',
    });

    const panel = wrapper.find('Panel');

    assert.equal(panel.props().icon, 'restricted');
    assert.equal(panel.props().title, 'My Panel');
  });

  it('provides an `onClose` handler that closes the panel', () => {
    const wrapper = createSidebarPanel({ panelName: 'flibberty' });

    wrapper.find('Panel').props().onClose();

    assert.calledWith(fakeStore.toggleSidebarPanel, 'flibberty', false);
  });

  it('shows content if active', () => {
    fakeStore.isSidebarPanelOpen.returns(true);
    const wrapper = createSidebarPanel();
    assert.isTrue(wrapper.find('Slider').prop('visible'));
  });

  it('hides content if not active', () => {
    fakeStore.isSidebarPanelOpen.returns(false);
    const wrapper = createSidebarPanel();
    assert.isFalse(wrapper.find('Slider').prop('visible'));
  });

  context('when panel state changes', () => {
    // Establish a component with an initial state and then change
    // that state
    const wrapperWithInitialState = (initialState, props = {}) => {
      fakeStore.isSidebarPanelOpen.returns(initialState);
      const wrapper = createSidebarPanel(props);
      fakeStore.isSidebarPanelOpen.returns(!initialState);
      return wrapper;
    };

    it('scrolls panel into view when opened after being closed', () => {
      const wrapper = wrapperWithInitialState(false, {});
      // force re-render
      wrapper.setProps({});

      assert.calledOnce(fakeScrollIntoView);
    });

    it('fires `onActiveChanged` callback if provided when opened', () => {
      const fakeCallback = sinon.stub();
      const wrapper = wrapperWithInitialState(false, {
        onActiveChanged: fakeCallback,
      });
      // force re-render
      wrapper.setProps({});

      assert.calledWith(fakeCallback, true);
    });

    it('fires `onActiveChanged` callback if provided when closed', () => {
      const fakeCallback = sinon.stub();
      const wrapper = wrapperWithInitialState(true, {
        onActiveChanged: fakeCallback,
      });
      // force re-render
      wrapper.setProps({});

      assert.calledWith(fakeCallback, false);
    });

    it('does not scroll panel if already opened', () => {
      // First render: panel is active
      fakeStore.isSidebarPanelOpen.returns(true);
      const wrapper = createSidebarPanel();
      // Re-rendering should not cause `scrollIntoView` to be invoked
      // As the panel is already open
      wrapper.setProps({});

      assert.isFalse(fakeScrollIntoView.called);
    });
  });

  it(
    'should pass a11y checks',
    checkAccessibility({
      content: () => createSidebarPanel(),
    })
  );
});
