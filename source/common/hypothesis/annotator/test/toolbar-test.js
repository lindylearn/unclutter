import { ToolbarController, $imports } from '../toolbar';

describe('ToolbarController', () => {
  let toolbarProps;
  let container;

  const createToolbar = options => {
    return new ToolbarController(container, {
      ...options,
    });
  };

  beforeEach(() => {
    container = document.createElement('div');
    toolbarProps = {};

    const FakeToolbar = props => {
      toolbarProps = props;
      return <div style={{ width: '150px' }} />;
    };

    $imports.$mock({
      './components/Toolbar': FakeToolbar,
    });
  });

  afterEach(() => {
    $imports.$restore();
    container.remove();
  });

  it('has expected default state', () => {
    const controller = createToolbar();
    assert.equal(controller.useMinimalControls, false);
    assert.equal(controller.sidebarOpen, false);
    assert.equal(controller.highlightsVisible, false);
    assert.equal(controller.newAnnotationType, 'note');
  });

  it('re-renders when `useMinimalControls` changes', () => {
    const controller = createToolbar();
    assert.include(toolbarProps, {
      useMinimalControls: false,
    });

    controller.useMinimalControls = true;

    assert.include(toolbarProps, {
      useMinimalControls: true,
    });
  });

  it('re-renders when `sidebarOpen` changes', () => {
    const controller = createToolbar();
    assert.include(toolbarProps, {
      isSidebarOpen: false,
    });

    controller.sidebarOpen = true;

    assert.include(toolbarProps, {
      isSidebarOpen: true,
    });
  });

  it('re-renders when `highlightsVisible` changes', () => {
    const controller = createToolbar();
    assert.include(toolbarProps, {
      showHighlights: false,
    });

    controller.highlightsVisible = true;

    assert.include(toolbarProps, {
      showHighlights: true,
    });
  });

  it('re-renders when `newAnnotationType` changes', () => {
    const controller = createToolbar();
    assert.include(toolbarProps, {
      newAnnotationType: 'note',
    });

    controller.newAnnotationType = 'annotation';

    assert.include(toolbarProps, {
      newAnnotationType: 'annotation',
    });
  });

  it('calls `setSidebarOpen` callback when sidebar toggle button is clicked', () => {
    const setSidebarOpen = sinon.stub();
    const controller = createToolbar({ setSidebarOpen });

    toolbarProps.toggleSidebar();
    assert.calledWith(setSidebarOpen, true);

    controller.sidebarOpen = true;
    toolbarProps.toggleSidebar();
    assert.calledWith(setSidebarOpen, false);
  });

  it('calls `setSidebarOpen` callback when sidebar close button is clicked', () => {
    const setSidebarOpen = sinon.stub();
    const controller = createToolbar({ setSidebarOpen });
    controller.useMinimalControls = true;

    toolbarProps.closeSidebar();

    assert.calledWith(setSidebarOpen, false);
  });

  it('calls `setHighlightsVisible` callback when highlights toggle button is clicked', () => {
    const setHighlightsVisible = sinon.stub();
    const controller = createToolbar({ setHighlightsVisible });

    toolbarProps.toggleHighlights();
    assert.calledWith(setHighlightsVisible, true);
    controller.highlightsVisible = true;

    toolbarProps.toggleHighlights();
    assert.calledWith(setHighlightsVisible, false);
  });

  it('calls `createAnnotation` callback when Create Note/Annotation button is clicked', () => {
    const createAnnotation = sinon.stub();
    const setSidebarOpen = sinon.stub();
    createToolbar({ createAnnotation, setSidebarOpen });

    toolbarProps.createAnnotation();

    assert.called(createAnnotation);
    assert.called(setSidebarOpen);
  });

  describe('#getWidth', () => {
    it(`returns the toolbar's width`, () => {
      // For the measured width to return the correct value, the toolbar must be rendered
      // into a document.
      document.body.appendChild(container);
      const toolbar = createToolbar();
      assert.equal(toolbar.getWidth(), 150);
    });
  });

  describe('#sidebarToggleButton', () => {
    it(`returns a reference to the sidebar toggle button`, () => {
      const controller = createToolbar();
      toolbarProps.toggleSidebarRef.current = 'a-button';
      assert.equal(controller.sidebarToggleButton, 'a-button');
    });
  });
});
