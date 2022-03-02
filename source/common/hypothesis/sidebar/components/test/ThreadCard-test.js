import { mount } from 'enzyme';

import ThreadCard from '../ThreadCard';
import { $imports } from '../ThreadCard';

import { checkAccessibility } from '../../../test-util/accessibility';
import mockImportedComponents from '../../../test-util/mock-imported-components';

describe('ThreadCard', () => {
  let fakeDebounce;
  let fakeFrameSync;
  let fakeStore;
  let fakeThread;

  function createComponent(props) {
    return mount(
      <ThreadCard frameSync={fakeFrameSync} thread={fakeThread} {...props} />
    );
  }

  beforeEach(() => {
    fakeDebounce = sinon.stub().returnsArg(0);
    fakeFrameSync = {
      focusAnnotations: sinon.stub(),
      scrollToAnnotation: sinon.stub(),
    };
    fakeStore = {
      isAnnotationFocused: sinon.stub().returns(false),
      route: sinon.stub(),
    };

    fakeThread = {
      id: 't1',
      annotation: { $tag: 'myTag' },
    };

    $imports.$mock(mockImportedComponents());
    $imports.$mock({
      'lodash.debounce': fakeDebounce,
      '../store/use-store': { useStoreProxy: () => fakeStore },
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  it('renders a `Thread` for the passed `thread`', () => {
    const wrapper = createComponent();
    assert(wrapper.find('Thread').props().thread === fakeThread);
  });

  it('applies a focused CSS class if the annotation thread is focused', () => {
    fakeStore.isAnnotationFocused.returns(true);

    const wrapper = createComponent();

    assert(wrapper.find('.ThreadCard').hasClass('is-focused'));
  });

  describe('mouse and click events', () => {
    it('scrolls to the annotation when the `ThreadCard` is clicked', () => {
      const wrapper = createComponent();

      wrapper.find('.ThreadCard').simulate('click');

      assert.calledWith(fakeFrameSync.scrollToAnnotation, 'myTag');
    });

    it('focuses the annotation thread when mouse enters', () => {
      const wrapper = createComponent();

      wrapper.find('.ThreadCard').simulate('mouseenter');

      assert.calledWith(fakeFrameSync.focusAnnotations, sinon.match(['myTag']));
    });

    it('unfocuses the annotation thread when mouse exits', () => {
      const wrapper = createComponent();

      wrapper.find('.ThreadCard').simulate('mouseleave');

      assert.calledWith(fakeFrameSync.focusAnnotations, sinon.match([]));
    });

    ['button', 'a'].forEach(tag => {
      it(`does not scroll to the annotation if the event's target or ancestor is a ${tag}`, () => {
        const wrapper = createComponent();
        const nodeTarget = document.createElement(tag);
        const nodeChild = document.createElement('div');
        nodeTarget.appendChild(nodeChild);

        wrapper.find('.ThreadCard').props().onClick({
          target: nodeTarget,
        });
        wrapper.find('.ThreadCard').props().onClick({
          target: nodeChild,
        });
        assert.notCalled(fakeFrameSync.scrollToAnnotation);
      });
    });
  });

  it(
    'should pass a11y checks',
    checkAccessibility({
      content: () => createComponent(),
    })
  );
});
