import { mount } from 'enzyme';
import { act } from 'preact/test-utils';

import { checkAccessibility } from '../../../../test-util/accessibility';

import AnnotationTimestamps, { $imports } from '../AnnotationTimestamps';

describe('AnnotationTimestamps', () => {
  let clock;
  let fakeTime;

  const createComponent = props =>
    mount(
      <AnnotationTimestamps
        annotationCreated="2015-05-10T20:18:56.613388+00:00"
        annotationUpdated="2015-05-10T20:18:56.613388+00:00"
        annotationUrl="http://www.example.com"
        withEditedTimestamp={false}
        {...props}
      />
    );

  beforeEach(() => {
    clock = sinon.useFakeTimers();

    fakeTime = {
      formatDate: sinon.stub().returns('absolute date'),
      formatRelativeDate: sinon.stub().returns('fuzzy string'),
      decayingInterval: sinon.stub(),
    };

    $imports.$mock({
      '../../util/time': fakeTime,
    });
  });

  afterEach(() => {
    clock.restore();
    $imports.$restore();
  });

  it('renders a linked created timestamp if annotation has a link', () => {
    const wrapper = createComponent();

    const link = wrapper.find('a');
    assert.equal(link.prop('href'), 'http://www.example.com');
    assert.equal(link.prop('title'), 'absolute date');
    assert.equal(link.text(), 'fuzzy string');
  });

  it('renders an unlinked created timestamp if annotation does not have a link', () => {
    const wrapper = createComponent({ annotationUrl: '' });

    const link = wrapper.find('a');
    const span = wrapper.find('span.AnnotationTimestamps__created');
    assert.isFalse(link.exists());
    assert.isTrue(span.exists());
    assert.equal(span.text(), 'fuzzy string');
  });

  it('renders edited timestamp if `withEditedTimestamp` is true', () => {
    fakeTime.formatRelativeDate.onCall(1).returns('another fuzzy string');

    const wrapper = createComponent({ withEditedTimestamp: true });

    const editedTimestamp = wrapper.find('.AnnotationTimestamps__edited');
    assert.isTrue(editedTimestamp.exists());
    assert.include(editedTimestamp.text(), '(edited another fuzzy string)');
  });

  it('does not render edited relative date if equivalent to created relative date', () => {
    fakeTime.formatRelativeDate.returns('equivalent fuzzy strings');

    const wrapper = createComponent({ withEditedTimestamp: true });

    const editedTimestamp = wrapper.find('.AnnotationTimestamps__edited');
    assert.isTrue(editedTimestamp.exists());
    assert.include(editedTimestamp.text(), '(edited)');
  });

  it('is updated after time passes', () => {
    fakeTime.decayingInterval.callsFake((date, callback) => {
      const id = setTimeout(callback, 10);
      return () => clearTimeout(id);
    });
    const wrapper = createComponent();
    fakeTime.formatRelativeDate.returns('60 jiffies');

    act(() => {
      clock.tick(1000);
    });
    wrapper.update();

    assert.equal(wrapper.text(), '60 jiffies');
  });

  it(
    'should pass a11y checks',
    checkAccessibility({
      content: () => {
        // Fake timers break axe-core.
        clock.restore();

        return createComponent();
      },
    })
  );
});
