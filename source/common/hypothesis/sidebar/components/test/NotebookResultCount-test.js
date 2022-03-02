import { mount } from 'enzyme';

import { checkAccessibility } from '../../../test-util/accessibility';

import NotebookResultCount from '../NotebookResultCount';
import { $imports } from '../NotebookResultCount';

describe('NotebookResultCount', () => {
  let fakeCountVisible;
  let fakeUseRootThread;

  const createComponent = (props = {}) => {
    return mount(
      <NotebookResultCount
        forcedVisibleCount={0}
        isFiltered={false}
        isLoading={false}
        resultCount={0}
        {...props}
      />
    );
  };

  beforeEach(() => {
    fakeCountVisible = sinon.stub().returns(0);
    fakeUseRootThread = sinon.stub().returns({ children: [] });

    $imports.$mock({
      './hooks/use-root-thread': fakeUseRootThread,
      '../helpers/thread': { countVisible: fakeCountVisible },
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  context('when there are no results', () => {
    it('should show "No Results" if no filters are applied', () => {
      fakeUseRootThread.returns({ children: [] });

      const wrapper = createComponent({ isFiltered: false });

      assert.equal(wrapper.text(), 'No results');
    });

    it('should show "No Results" if filters are applied', () => {
      fakeUseRootThread.returns({ children: [] });

      const wrapper = createComponent({ isFiltered: true });

      assert.equal(wrapper.text(), 'No results');
    });
  });

  context('no applied filter', () => {
    [
      {
        thread: { children: [1] },
        visibleCount: 1,
        expected: '1 thread(1 annotation)',
      },
      {
        thread: { children: [1] },
        visibleCount: 2,
        expected: '1 thread(2 annotations)',
      },
      {
        thread: { children: [1, 2] },
        visibleCount: 2,
        expected: '2 threads(2 annotations)',
      },
    ].forEach(test => {
      it('should render a count of threads and annotations', () => {
        fakeCountVisible.returns(test.visibleCount);
        fakeUseRootThread.returns(test.thread);

        const wrapper = createComponent();

        assert.equal(wrapper.text(), test.expected);
      });
    });
  });

  context('with one or more applied filters', () => {
    [
      {
        forcedVisibleCount: 0,
        thread: { children: [1] },
        visibleCount: 1,
        expected: '1 result',
      },
      {
        forcedVisibleCount: 0,
        thread: { children: [1] },
        visibleCount: 2,
        expected: '2 results',
      },
      {
        forcedVisibleCount: 1,
        thread: { children: [1] },
        visibleCount: 3,
        expected: '2 results(and 1 more)',
      },
    ].forEach(test => {
      it('should render a count of results', () => {
        fakeUseRootThread.returns(test.thread);
        fakeCountVisible.returns(test.visibleCount);

        const wrapper = createComponent({
          forcedVisibleCount: test.forcedVisibleCount,
          isFiltered: true,
        });

        assert.equal(wrapper.text(), test.expected);
      });
    });
  });

  context('when loading', () => {
    it('shows a loading spinner', () => {
      const wrapper = createComponent({ isLoading: true });
      assert.isTrue(wrapper.find('Spinner').exists());
    });

    it('shows annotation count if there are any matching annotations being fetched', () => {
      fakeUseRootThread.returns({ children: [1, 2] });
      // Setting countVisible to something different to demonstrate that
      // resultCount is used while loading
      fakeCountVisible.returns(5);

      const wrapper = createComponent({ isLoading: true, resultCount: 2 });

      assert.include(wrapper.text(), '(2 annotations)');
    });
  });

  it(
    'should pass a11y checks',
    checkAccessibility([
      {
        name: 'no results',
        content: () => createComponent({ isFiltered: true }),
      },
      {
        name: 'with results',
        content: () => {
          fakeCountVisible.returns(2);
          fakeUseRootThread.returns({ children: [1, 2] });
          return createComponent();
        },
      },
      {
        name: 'with results and filters applied',
        content: () => {
          fakeCountVisible.returns(3);
          fakeUseRootThread.returns({ children: [1] });
          return createComponent({ forcedVisibleCount: 1, isFiltered: true });
        },
      },
      {
        name: 'loading spinner',
        content: () => {
          return createComponent({ isLoading: true });
        },
      },
    ])
  );
});
