import { mount } from 'enzyme';
import { act } from 'preact/test-utils';

import ThreadList from '../ThreadList';
import { $imports } from '../ThreadList';

import { checkAccessibility } from '../../../test-util/accessibility';
import mockImportedComponents from '../../../test-util/mock-imported-components';

describe('ThreadList', () => {
  let fakeDomUtil;
  let fakeMetadata;
  let fakeTopThread;
  let fakeScrollContainer;
  let fakeStore;
  let fakeVisibleThreadsUtil;
  let wrappers;

  function createComponent(props) {
    const wrapper = mount(
      <ThreadList threads={fakeTopThread.children} {...props} />,
      {
        attachTo: fakeScrollContainer,
      }
    );
    wrappers.push(wrapper);
    return wrapper;
  }

  beforeEach(() => {
    wrappers = [];
    fakeDomUtil = {
      getElementHeightWithMargins: sinon.stub().returns(0),
    };
    fakeMetadata = {
      isHighlight: sinon.stub().returns(false),
    };

    fakeScrollContainer = document.createElement('div');
    fakeScrollContainer.className = 'js-thread-list-scroll-root';
    fakeScrollContainer.style.height = '2000px';
    document.body.appendChild(fakeScrollContainer);

    fakeStore = {
      setForcedVisible: sinon.stub(),
      unsavedAnnotations: sinon.stub().returns([]),
    };

    fakeTopThread = {
      id: 't0',
      annotation: { $tag: 'myTag0' },
      children: [
        { id: 't1', children: [], annotation: { $tag: 't1' } },
        { id: 't2', children: [], annotation: { $tag: 't2' } },
        { id: 't3', children: [], annotation: { $tag: 't3' } },
        { id: 't4', children: [], annotation: { $tag: 't4' } },
      ],
    };

    fakeVisibleThreadsUtil = {
      calculateVisibleThreads: sinon.stub().returns({
        visibleThreads: fakeTopThread.children,
        offscreenUpperHeight: 400,
        offscreenLowerHeight: 600,
      }),
      THREAD_DIMENSION_DEFAULTS: {
        defaultHeight: 200,
      },
    };

    $imports.$mock(mockImportedComponents());
    $imports.$mock({
      '../store/use-store': { useStoreProxy: () => fakeStore },
      '../helpers/annotation-metadata': fakeMetadata,
      '../util/dom': fakeDomUtil,
      '../helpers/visible-threads': fakeVisibleThreadsUtil,
    });
    sinon.stub(console, 'warn');
  });

  afterEach(() => {
    console.warn.restore();
    $imports.$restore();
    // Make sure all mounted components are unmounted
    wrappers.forEach(wrapper => wrapper.unmount());
    fakeScrollContainer.remove();
  });

  it('calculates visible threads', () => {
    createComponent();

    assert.calledWith(
      fakeVisibleThreadsUtil.calculateVisibleThreads,
      fakeTopThread.children,
      sinon.match({}),
      0,
      sinon.match.number
    );
  });

  /**
   * Simulate what happens when a new draft annotation is created in the
   * application.
   */
  const addNewAnnotation = (wrapper, annotation = { $tag: 'foobar' }) => {
    fakeStore.unsavedAnnotations.returns([annotation]);
    wrapper.setProps({});
  };

  context('invalid scroll container', () => {
    it('should throw an error if the scroll container is missing', () => {
      fakeScrollContainer.remove();
      assert.throws(() => {
        createComponent();
      }, 'Scroll container is missing');
    });
  });

  context('new annotation created in application', () => {
    it('sets the new annotation to forced-visible', () => {
      const wrapper = createComponent();
      addNewAnnotation(wrapper);
      assert.calledOnce(fakeStore.setForcedVisible);
      assert.calledWith(fakeStore.setForcedVisible, 'foobar', true);
    });
  });

  context('active scroll to an annotation thread', () => {
    let fakeScrollTop;

    beforeEach(() => {
      fakeScrollTop = sinon.stub();
      sinon.stub(fakeScrollContainer, 'scrollTop').set(fakeScrollTop);
      sinon
        .stub(document, 'querySelector')
        .withArgs('.js-thread-list-scroll-root')
        .returns(fakeScrollContainer);
    });

    afterEach(() => {
      document.querySelector.restore();
    });

    it('should do nothing if there is no active annotation thread to scroll to', () => {
      createComponent();

      assert.notCalled(fakeScrollTop);
    });

    it('should do nothing if the annotation thread to scroll to is not in DOM', () => {
      const wrapper = createComponent();

      addNewAnnotation(wrapper);

      assert.notCalled(fakeScrollTop);
    });

    it('should set the scroll container `scrollTop` to derived position of thread', () => {
      const wrapper = createComponent();

      addNewAnnotation(wrapper, fakeTopThread.children[3].annotation);

      // The third thread in a collection of threads at default height (200)
      // should be at 600px. This setting of `scrollTop` is the only externally-
      // observable thing that happens here...
      assert.calledWith(fakeScrollTop, 600);
    });
  });

  /**
   * Get the blank spacer `<div>` that reserves space for non-rendered threads
   * above the viewport.
   */
  const getUpperSpacer = wrapper => wrapper.find('div > div').first();

  /**
   * Get the blank spacer `<div>` that reserves space for non-rendered threads
   * below the viewport.
   */
  const getLowerSpacer = wrapper => wrapper.find('div > div').last();

  it('renders dimensional elements above and below visible threads', () => {
    const wrapper = createComponent();
    const upperDiv = getUpperSpacer(wrapper);
    const lowerDiv = getLowerSpacer(wrapper);
    assert.equal(upperDiv.getDOMNode().style.height, '400px');
    assert.equal(lowerDiv.getDOMNode().style.height, '600px');
  });

  /**
   * Tests for the virtualization features of `ThreadList` (ie. the fact that
   * `ThreadList` only renders threads in/near the viewport).
   */
  describe('thread list virtualization', () => {
    let threadHeights;
    const minThreadHeight = 150;

    beforeEach(() => {
      // Set up the scroll container.
      fakeScrollContainer.style.height = 'auto';
      fakeScrollContainer.style.maxHeight = '350px';
      fakeScrollContainer.style.overflow = 'scroll';

      // Create dummy threads and render them with fixed heights.
      threadHeights = {};
      fakeTopThread.children = [];
      for (let i = 0; i < 20; i++) {
        const id = `thread-${i}`;
        threadHeights[id] = minThreadHeight + i * 3;
        fakeTopThread.children.push({ id });
      }

      const FakeThreadCard = ({ thread }) => {
        const height = threadHeights[thread.id];
        return <div className="fake-ThreadCard" style={{ height }} />;
      };
      FakeThreadCard.displayName = 'ThreadCard';

      // Disable debouncing of events that trigger re-rendering of the list.
      const noopDebounce = callback => {
        const debounced = () => {
          callback();
        };
        debounced.cancel = () => {};
        return debounced;
      };

      $imports.$mock({
        'lodash.debounce': noopDebounce,
        './ThreadCard': FakeThreadCard,
      });

      // For these tests, don't mock element height or visible thread calculation.
      $imports.$restore({
        '../util/dom': true,
        '../helpers/visible-threads': true,
      });
    });

    it('only renders visible threads', () => {
      const wrapper = createComponent();
      const renderedThreads = wrapper.find('ThreadCard');

      // "7" is the current expected value given the thread heights, scroll
      // container size and constants in `../helpers/visible-threads`.
      assert.equal(renderedThreads.length, 7);
    });

    it('updates thread heights as the list is scrolled', () => {
      const scrollTo = yOffset => {
        act(() => {
          fakeScrollContainer.scrollTop = yOffset;
          fakeScrollContainer.dispatchEvent(new Event('scroll'));
        });
      };

      // Render the list. Initially threads near the viewport will be rendered
      // and an "estimate" (a default value) will be used for other threads.
      // Therefore the scroll bar range will only be approximate.
      const wrapper = createComponent();

      // Calculate expected total height of thread list contents.
      const getRect = wrapper => wrapper.getDOMNode().getBoundingClientRect();
      const cards = wrapper.find('.ThreadList__card');
      const spaceBelowEachCard =
        getRect(cards.at(1)).top - getRect(cards.at(0)).bottom;
      const totalThreadHeight = fakeTopThread.children.reduce(
        (totalHeight, thread) => totalHeight + threadHeights[thread.id],
        0
      );
      const expectedScrollHeight =
        totalThreadHeight + spaceBelowEachCard * fakeTopThread.children.length;

      assert.notEqual(fakeScrollContainer.scrollHeight, expectedScrollHeight);

      // The space reserved for non-rendered threads will be a multiple of
      // the default, as we haven't measured them yet.
      const lowerSpacer = getLowerSpacer(wrapper).getDOMNode();
      const defaultThreadHeight = 200;
      assert.equal(
        lowerSpacer.getBoundingClientRect().height % defaultThreadHeight,
        0
      );

      // Scroll through the list "slowly", such that we render every thread at
      // least once. As new threads are scrolled into view, their heights
      // should be measured and used to determine accurately how much space to
      // reserve when the threads are no longer visible.
      for (
        let y = 0;
        y < fakeScrollContainer.scrollHeight;
        y += minThreadHeight
      ) {
        scrollTo(y);
      }

      // Once we've finished scrolling through the list, all of the thread heights
      // will have been calculated and the scroll bar range should match what it
      // would be if the list was not virtualized.
      assert.equal(fakeScrollContainer.scrollHeight, expectedScrollHeight);
    });
  });

  it('renders a `ThreadCard` for each visible thread', () => {
    const wrapper = createComponent();
    const cards = wrapper.find('ThreadCard');
    assert.equal(cards.length, fakeTopThread.children.length);
  });

  it('does not error if thread heights cannot be measured', () => {
    // Render the `ThreadList` unconnected to a document. This will prevent
    // it from being able to measure the height of rendered threads.
    const wrapper = mount(<ThreadList threads={fakeTopThread.children} />);
    wrappers.push(wrapper);
    assert.calledWith(
      console.warn,
      'ThreadList could not measure thread. Element not found.'
    );
  });

  it(
    'should pass a11y checks',
    checkAccessibility({
      content: () => {
        const wrapper = createComponent();
        return wrapper;
      },
    })
  );
});
