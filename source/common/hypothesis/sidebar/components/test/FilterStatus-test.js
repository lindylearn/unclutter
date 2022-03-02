import { mount } from 'enzyme';

import FilterStatus, { $imports } from '../FilterStatus';

import mockImportedComponents from '../../../test-util/mock-imported-components';

function getFilterState() {
  return {
    filterQuery: null,
    focusActive: false,
    focusConfigured: false,
    focusDisplayName: null,
    forcedVisibleCount: 0,
    selectedCount: 0,
  };
}

function getFocusState() {
  return {
    active: false,
    configured: false,
    focusDisplayName: '',
  };
}

describe('FilterStatus', () => {
  let fakeStore;
  let fakeUseRootThread;
  let fakeThreadUtil;

  const createComponent = () => {
    return mount(<FilterStatus />);
  };

  beforeEach(() => {
    fakeThreadUtil = {
      countVisible: sinon.stub().returns(0),
    };
    fakeStore = {
      annotationCount: sinon.stub(),
      clearSelection: sinon.stub(),
      directLinkedAnnotationId: sinon.stub(),
      filterQuery: sinon.stub().returns(null),
      filterState: sinon.stub().returns(getFilterState()),
      focusState: sinon.stub().returns(getFocusState()),
      forcedVisibleThreads: sinon.stub().returns([]),
      selectedAnnotations: sinon.stub().returns([]),
      toggleFocusMode: sinon.stub(),
    };

    fakeUseRootThread = sinon.stub().returns({});

    $imports.$mock(mockImportedComponents());
    $imports.$mock({
      './hooks/use-root-thread': fakeUseRootThread,
      '../store/use-store': { useStoreProxy: () => fakeStore },
      '../helpers/thread': fakeThreadUtil,
    });
  });

  function assertFilterText(wrapper, text) {
    const filterText = wrapper.find('.FilterStatus__text').text();
    assert.equal(filterText, text);
  }

  function assertButton(wrapper, expected) {
    const buttonProps = wrapper.find('LabeledButton').props();

    assert.equal(buttonProps.title, expected.text);
    assert.equal(buttonProps.icon, expected.icon);
    buttonProps.onClick();
    assert.calledOnce(expected.callback);
  }

  function assertClearButton(wrapper) {
    assertButton(wrapper, {
      text: 'Clear search',
      icon: 'cancel',
      callback: fakeStore.clearSelection,
    });
  }

  context('(State 1): no search filters active', () => {
    it('should return null if filter state indicates no active filters', () => {
      const wrapper = createComponent();
      assert.equal(wrapper.children().length, 0);
    });
  });

  context('(State 2): filtered by query', () => {
    beforeEach(() => {
      fakeStore.filterQuery.returns('foobar');
      fakeThreadUtil.countVisible.returns(1);
    });

    it('should provide a "Clear search" button that clears the selection', () => {
      assertClearButton(createComponent());
    });

    it('should show the count of matching results', () => {
      assertFilterText(createComponent(), "Showing 1 result for 'foobar'");
    });

    it('should show pluralized count of results when appropriate', () => {
      fakeThreadUtil.countVisible.returns(5);
      assertFilterText(createComponent(), "Showing 5 results for 'foobar'");
    });

    it('should show a no results message when no matches', () => {
      fakeThreadUtil.countVisible.returns(0);
      assertFilterText(createComponent(), "No results for 'foobar'");
    });
  });

  context('(State 3): filtered by query with force-expanded threads', () => {
    beforeEach(() => {
      fakeStore.filterQuery.returns('foobar');
      fakeStore.forcedVisibleThreads.returns([1, 2, 3]);
      fakeThreadUtil.countVisible.returns(5);
    });

    it('should show a separate count for results versus forced visible', () => {
      assertFilterText(
        createComponent(),
        "Showing 2 results for 'foobar' (and 3 more)"
      );
    });

    it('should provide a "Clear search" button that clears the selection', () => {
      assertClearButton(createComponent());
    });
  });

  context('(State 4): selected annotations', () => {
    beforeEach(() => {
      fakeStore.selectedAnnotations.returns([1]);
    });

    it('should show the count of annotations', () => {
      assertFilterText(createComponent(), 'Showing 1 annotation');
    });

    it('should pluralize annotations when necessary', () => {
      fakeStore.selectedAnnotations.returns([1, 2, 3, 4]);

      assertFilterText(createComponent(), 'Showing 4 annotations');
    });

    it('should show the count of additionally-shown top-level annotations', () => {
      // In selection mode, "forced visible" count is computed by subtracting
      // the selectedCount from the count of all visible top-level threads
      // (children/replies are ignored in this count)
      fakeUseRootThread.returns({
        id: '__default__',
        children: [
          { id: '1', annotation: { $tag: '1' }, visible: true, children: [] },
          {
            id: '2',
            annotation: { $tag: '2' },
            visible: true,
            children: [
              {
                id: '2a',
                annotation: { $tag: '2a' },
                visible: true,
                children: [],
              },
            ],
          },
        ],
      });
      assertFilterText(createComponent(), 'Showing 1 annotation (and 1 more)');
    });

    it('should provide a "Show all" button that shows a count of all annotations', () => {
      fakeStore.annotationCount.returns(5);
      assertButton(createComponent(), {
        text: 'Show all (5)',
        icon: 'cancel',
        callback: fakeStore.clearSelection,
      });
    });

    it('should not show count of annotations on "Show All" button if direct-linked annotation present', () => {
      fakeStore.annotationCount.returns(5);
      fakeStore.directLinkedAnnotationId.returns(1);
      assertButton(createComponent(), {
        text: 'Show all',
        icon: 'cancel',
        callback: fakeStore.clearSelection,
      });
    });
  });

  context('(State 5): user-focus mode active', () => {
    beforeEach(() => {
      fakeStore.focusState.returns({
        active: true,
        configured: true,
        displayName: 'Ebenezer Studentolog',
      });
      fakeThreadUtil.countVisible.returns(1);
    });

    it('should show a count of annotations by the focused user', () => {
      assertFilterText(
        createComponent(),
        'Showing 1 annotation by Ebenezer Studentolog'
      );
    });

    it('should pluralize annotations when needed', () => {
      fakeThreadUtil.countVisible.returns(3);
      assertFilterText(
        createComponent(),
        'Showing 3 annotations by Ebenezer Studentolog'
      );
    });

    it('should show a no results message when user has no annotations', () => {
      fakeThreadUtil.countVisible.returns(0);
      assertFilterText(
        createComponent(),
        'No annotations by Ebenezer Studentolog'
      );
    });

    it('should provide a "Show all" button that toggles user focus mode', () => {
      assertButton(createComponent(), {
        text: 'Show all',
        icon: null,
        callback: fakeStore.toggleFocusMode,
      });
    });
  });

  context('(State 6): user-focus mode active, filtered by query', () => {
    beforeEach(() => {
      fakeStore.focusState.returns({
        active: true,
        configured: true,
        displayName: 'Ebenezer Studentolog',
      });
      fakeStore.filterQuery.returns('biscuits');
      fakeThreadUtil.countVisible.returns(1);
    });

    it('should show a count of annotations by the focused user', () => {
      assertFilterText(
        createComponent(),
        "Showing 1 result for 'biscuits' by Ebenezer Studentolog"
      );
    });

    it('should pluralize annotations when needed', () => {
      fakeThreadUtil.countVisible.returns(3);
      assertFilterText(
        createComponent(),
        "Showing 3 results for 'biscuits' by Ebenezer Studentolog"
      );
    });

    it('should show a no results message when user has no annotations', () => {
      fakeThreadUtil.countVisible.returns(0);
      assertFilterText(
        createComponent(),
        "No results for 'biscuits' by Ebenezer Studentolog"
      );
    });

    it('should provide a "Clear search" button', () => {
      assertClearButton(createComponent());
    });
  });

  context(
    '(State 7): user-focus mode active, filtered by query, force-expanded threads',
    () => {
      beforeEach(() => {
        fakeStore.focusState.returns({
          active: true,
          configured: true,
          displayName: 'Ebenezer Studentolog',
        });
        fakeStore.filterQuery.returns('biscuits');
        fakeStore.forcedVisibleThreads.returns([1, 2]);
        fakeThreadUtil.countVisible.returns(3);
      });

      it('should show a count of annotations by the focused user', () => {
        assertFilterText(
          createComponent(),
          "Showing 1 result for 'biscuits' by Ebenezer Studentolog (and 2 more)"
        );
      });

      it('should provide a "Clear search" button', () => {
        assertClearButton(createComponent());
      });
    }
  );

  context('(State 8): user-focus mode active, selected annotations', () => {
    beforeEach(() => {
      fakeStore.focusState.returns({
        active: true,
        configured: true,
        displayName: 'Ebenezer Studentolog',
      });
      fakeStore.selectedAnnotations.returns([1, 2]);
    });

    it('should ignore user and display selected annotations', () => {
      assertFilterText(createComponent(), 'Showing 2 annotations');
    });

    it('should provide a "Show all" button', () => {
      assertButton(createComponent(), {
        text: 'Show all',
        icon: 'cancel',
        callback: fakeStore.clearSelection,
      });
    });
  });

  context('(State 9): user-focus mode active, force-expanded threads', () => {
    beforeEach(() => {
      fakeStore.focusState.returns({
        active: true,
        configured: true,
        displayName: 'Ebenezer Studentolog',
      });
      fakeStore.forcedVisibleThreads.returns([1, 2, 3]);
      fakeThreadUtil.countVisible.returns(7);
    });

    it('should show count of user results separately from forced-visible threads', () => {
      assertFilterText(
        createComponent(),
        'Showing 4 annotations by Ebenezer Studentolog (and 3 more)'
      );
    });

    it('should handle cases when there are no focused-user annotations', () => {
      fakeStore.forcedVisibleThreads.returns([1, 2, 3, 4, 5, 6, 7]);
      assertFilterText(
        createComponent(),
        'No annotations by Ebenezer Studentolog (and 7 more)'
      );
    });

    it('should provide a "Reset filters" button', () => {
      assertButton(createComponent(), {
        text: 'Reset filters',
        icon: null,
        callback: fakeStore.clearSelection,
      });
    });
  });

  context('(State 10): user-focus mode configured but inactive', () => {
    beforeEach(() => {
      fakeStore.focusState.returns({
        active: false,
        configured: true,
        displayName: 'Ebenezer Studentolog',
      });
      fakeThreadUtil.countVisible.returns(7);
    });

    it("should show a count of everyone's annotations", () => {
      assertFilterText(createComponent(), 'Showing 7 annotations');
    });

    it('should provide a button to activate user-focused mode', () => {
      assertButton(createComponent(), {
        text: 'Show only Ebenezer Studentolog',
        icon: null,
        callback: fakeStore.toggleFocusMode,
      });
    });
  });
});
