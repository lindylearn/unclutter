import { mount } from 'enzyme';

import Slider from '../Slider';

import { checkAccessibility } from '../../../test-util/accessibility';

describe('Slider', () => {
  let container;

  const createSlider = (props = {}) => {
    return mount(
      <Slider visible={false} {...props}>
        <div style={{ width: 100, height: 200 }}>Test content</div>
      </Slider>,
      { attachTo: container }
    );
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('should render collapsed if `visible` is false on mount', () => {
    const wrapper = createSlider({ visible: false });
    const { height } = wrapper.getDOMNode().getBoundingClientRect();
    assert.equal(height, 0);

    // The content shouldn't be rendered, so it doesn't appear in the keyboard
    // navigation order.
    assert.equal(wrapper.getDOMNode().style.display, 'none');
  });

  it('should render expanded if `visible` is true on mount', () => {
    const wrapper = createSlider({ visible: true });
    const { height } = wrapper.getDOMNode().getBoundingClientRect();
    assert.equal(height, 200);
  });

  it('should transition to expanded if `visible` changes to `true`', () => {
    const wrapper = createSlider({ visible: false });

    wrapper.setProps({ visible: true });

    const containerStyle = wrapper.getDOMNode().style;
    assert.equal(containerStyle.height, '200px');
  });

  it('should transition to collapsed if `visible` changes to `false`', done => {
    const wrapper = createSlider({ visible: true });

    wrapper.setProps({ visible: false });

    setTimeout(() => {
      const containerStyle = wrapper.getDOMNode().style;
      assert.equal(containerStyle.height, '0px');
      done();
    }, 1);
  });

  it('should set the container height to "auto" when an expand transition finishes', () => {
    const wrapper = createSlider({ visible: false });

    wrapper.setProps({ visible: true });

    let containerStyle = wrapper.getDOMNode().style;
    assert.equal(containerStyle.height, '200px');

    wrapper.find('div').first().simulate('transitionend');

    containerStyle = wrapper.getDOMNode().style;
    assert.equal(containerStyle.height, 'auto');
  });

  it('should hide overflowing content when not fully visible', () => {
    // When fully collapsed, overflow should be hidden.
    const wrapper = createSlider({ visible: false });
    let containerStyle = wrapper.getDOMNode().style;
    assert.equal(containerStyle.overflow, 'hidden');

    // When starting to expand, or when collapsing, overflow should also be hidden.
    wrapper.setProps({ visible: true });
    assert.equal(containerStyle.overflow, 'hidden');

    // When fully visible, we make overflow visible to make focus rings or
    // other content which extends beyond the bounds of the Slider visible.
    wrapper.find('div').first().simulate('transitionend');
    containerStyle = wrapper.getDOMNode().style;
    assert.equal(containerStyle.overflow, 'visible');
  });

  it('should stop rendering content when a collapse transition finishes', () => {
    const wrapper = createSlider({ visible: true });

    wrapper.setProps({ visible: false });

    wrapper.find('div').first().simulate('transitionend');

    const containerStyle = wrapper.getDOMNode().style;
    assert.equal(containerStyle.display, 'none');
  });

  [true, false].forEach(visible => {
    it('should handle unmounting while expanding or collapsing', () => {
      const wrapper = createSlider({ visible });
      wrapper.setProps({ visible: !visible });
      wrapper.unmount();
    });
  });

  it(
    'should pass a11y checks',
    checkAccessibility([
      {
        name: 'visible',
        content: () => createSlider({ visible: true }),
      },
      {
        name: 'hidden',
        content: () => createSlider({ visible: false }),
      },
    ])
  );
});
