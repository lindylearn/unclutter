import { mount } from 'enzyme';
import { act } from 'preact/test-utils';

import Excerpt from '../Excerpt';
import { $imports } from '../Excerpt';

import { checkAccessibility } from '../../../test-util/accessibility';

describe('Excerpt', () => {
  const SHORT_DIV = <div id="foo" style={{ height: 5 }} />;
  const TALL_DIV = (
    <div id="foo" style={{ height: 200 }}>
      foo bar
    </div>
  );
  const DEFAULT_CONTENT = <span className="the-content">default content</span>;

  let container;
  let fakeObserveElementSize;

  function createExcerpt(props = {}, content = DEFAULT_CONTENT) {
    return mount(
      <Excerpt
        collapse={true}
        collapsedHeight={40}
        inlineControls={false}
        settings={{}}
        {...props}
      >
        {content}
      </Excerpt>,
      { attachTo: container }
    );
  }

  beforeEach(() => {
    fakeObserveElementSize = sinon.stub();
    container = document.createElement('div');
    document.body.appendChild(container);

    $imports.$mock({
      '../util/observe-element-size': fakeObserveElementSize,
    });
  });

  afterEach(() => {
    $imports.$restore();
    container.remove();
  });

  function getExcerptHeight(wrapper) {
    return wrapper.find('.Excerpt').prop('style')['max-height'];
  }

  it('renders content in container', () => {
    const wrapper = createExcerpt();
    const contentEl = wrapper.find('.Excerpt__content');
    assert.include(contentEl.html(), 'default content');
  });

  it('truncates content if it exceeds `collapsedHeight` + `overflowThreshold`', () => {
    const wrapper = createExcerpt({}, TALL_DIV);
    assert.equal(getExcerptHeight(wrapper), 40);
  });

  it('does not truncate content if it does not exceed `collapsedHeight` + `overflowThreshold`', () => {
    const wrapper = createExcerpt({}, SHORT_DIV);
    assert.equal(getExcerptHeight(wrapper), 5);
  });

  it('updates the collapsed state when the content height changes', () => {
    const wrapper = createExcerpt({}, SHORT_DIV);
    assert.called(fakeObserveElementSize);

    const contentElem = fakeObserveElementSize.getCall(0).args[0];
    const sizeChangedCallback = fakeObserveElementSize.getCall(0).args[1];
    act(() => {
      contentElem.style.height = '400px';
      sizeChangedCallback();
    });
    wrapper.update();

    assert.equal(getExcerptHeight(wrapper), 40);

    act(() => {
      contentElem.style.height = '10px';
      sizeChangedCallback();
    });
    wrapper.update();

    assert.equal(getExcerptHeight(wrapper), 10);
  });

  it('calls `onCollapsibleChanged` when collapsibility changes', () => {
    const onCollapsibleChanged = sinon.stub();
    createExcerpt({ onCollapsibleChanged }, SHORT_DIV);

    const contentElem = fakeObserveElementSize.getCall(0).args[0];
    const sizeChangedCallback = fakeObserveElementSize.getCall(0).args[1];
    act(() => {
      contentElem.style.height = '400px';
      sizeChangedCallback();
    });

    assert.calledWith(onCollapsibleChanged, true);
  });

  it('calls `onToggleCollapsed` when user clicks in bottom area to expand excerpt', () => {
    const onToggleCollapsed = sinon.stub();
    const wrapper = createExcerpt({ onToggleCollapsed }, TALL_DIV);
    const control = wrapper.find('.Excerpt__shadow');
    assert.equal(getExcerptHeight(wrapper), 40);
    control.simulate('click');
    assert.called(onToggleCollapsed);
  });

  context('when inline controls are enabled', () => {
    const getToggleButton = wrapper =>
      wrapper.find(
        'LinkButton[title="Toggle visibility of full excerpt text"]'
      );

    it('displays inline controls if collapsed', () => {
      const wrapper = createExcerpt({ inlineControls: true }, TALL_DIV);
      assert.isTrue(wrapper.exists('InlineControls'));
    });

    it('does not display inline controls if not collapsed', () => {
      const wrapper = createExcerpt({ inlineControls: true }, SHORT_DIV);
      assert.isFalse(wrapper.exists('InlineControls'));
    });

    it('toggles the expanded state when clicked', () => {
      const wrapper = createExcerpt({ inlineControls: true }, TALL_DIV);
      const button = getToggleButton(wrapper);
      assert.equal(getExcerptHeight(wrapper), 40);
      act(() => {
        button.props().onClick();
      });
      wrapper.update();
      assert.equal(getExcerptHeight(wrapper), 200);
    });

    it("sets button's default state to un-expanded", () => {
      const wrapper = createExcerpt({ inlineControls: true }, TALL_DIV);
      const button = getToggleButton(wrapper);
      assert.equal(button.prop('expanded'), false);
      assert.equal(button.text(), 'More');
    });

    it("changes button's state to expanded when clicked", () => {
      const wrapper = createExcerpt({ inlineControls: true }, TALL_DIV);
      let button = getToggleButton(wrapper);
      act(() => {
        button.props().onClick();
      });
      wrapper.update();
      button = getToggleButton(wrapper);
      assert.equal(button.prop('expanded'), true);
      assert.equal(button.text(), 'Less');
    });
  });

  it(
    'should pass a11y checks',
    checkAccessibility([
      {
        name: 'external controls',
        content: () => createExcerpt({}, TALL_DIV),
      },
      {
        name: 'internal controls',
        content: () => createExcerpt({ inlineControls: true }, TALL_DIV),
      },
    ])
  );
});
