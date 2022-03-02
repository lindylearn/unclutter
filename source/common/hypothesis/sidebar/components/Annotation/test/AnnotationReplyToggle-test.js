import { mount } from 'enzyme';
import { act } from 'preact/test-utils';

import { checkAccessibility } from '../../../../test-util/accessibility';

import AnnotationReplyToggle from '../AnnotationReplyToggle';

describe('AnnotationReplyToggle', () => {
  let fakeOnToggleReplies;

  function createComponent(props = {}) {
    return mount(
      <AnnotationReplyToggle
        onToggleReplies={fakeOnToggleReplies}
        replyCount={5}
        threadIsCollapsed={true}
        {...props}
      />
    );
  }

  beforeEach(() => {
    fakeOnToggleReplies = sinon.stub();
    // Note that this component does not mock imported components
    // because it entirely consists of a `LinkButton`
  });

  it('renders expand wording if thread is collapsed', () => {
    const wrapper = createComponent();

    assert.match(wrapper.text(), /^Show replies/);
  });

  it('renders collapse wording if thread is expanded', () => {
    const wrapper = createComponent({ threadIsCollapsed: false });

    assert.match(wrapper.text(), /^Hide replies/);
  });

  it('shows the reply count', () => {
    const wrapper = createComponent({ replyCount: 7 });
    assert.equal(wrapper.text(), 'Show replies (7)');
  });

  it('invokes the toggle callback when clicked', () => {
    const wrapper = createComponent();
    const button = wrapper.find('LinkButton');

    act(() => {
      button.props().onClick();
    });

    assert.calledOnce(fakeOnToggleReplies);
  });

  it(
    'should pass a11y checks',
    checkAccessibility({
      content: () => createComponent(),
    })
  );
});
