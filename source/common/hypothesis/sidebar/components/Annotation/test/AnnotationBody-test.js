import { mount } from 'enzyme';
import { act } from 'preact/test-utils';

import * as fixtures from '../../../test/annotation-fixtures';

import { checkAccessibility } from '../../../../test-util/accessibility';
import mockImportedComponents from '../../../../test-util/mock-imported-components';

import AnnotationBody, { $imports } from '../AnnotationBody';

describe('AnnotationBody', () => {
  let fakeAnnotation;
  let fakeApplyTheme;
  let fakeSettings;

  // Inject dependency mocks
  let fakeStore;

  const setEditingMode = (isEditing = true) => {
    // The presence of a draft will make `isEditing` `true`
    if (isEditing) {
      fakeStore.getDraft.returns({
        ...fixtures.defaultDraft(),
        text: 'this is a draft',
        tags: ['1', '2'],
      });
    } else {
      fakeStore.getDraft.returns(null);
    }
  };

  function createBody(props = {}) {
    return mount(
      <AnnotationBody
        annotation={fakeAnnotation}
        settings={fakeSettings}
        {...props}
      />
    );
  }

  beforeEach(() => {
    fakeAnnotation = fixtures.defaultAnnotation();
    fakeAnnotation.text = 'some text here';
    fakeAnnotation.tags = ['eenie', 'minie'];
    fakeApplyTheme = sinon.stub();
    fakeSettings = {};

    fakeStore = {
      getDraft: sinon.stub().returns(null),
    };

    $imports.$mock(mockImportedComponents());
    $imports.$mock({
      '../../helpers/theme': { applyTheme: fakeApplyTheme },
      '../../store/use-store': { useStoreProxy: () => fakeStore },
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  it('renders the tags and text from the annotation', () => {
    const wrapper = createBody();
    wrapper.update();

    const markdownView = wrapper.find('MarkdownView');
    const tagList = wrapper.find('TagList');
    assert.strictEqual(markdownView.props().markdown, 'some text here');
    assert.deepStrictEqual(tagList.props().tags, ['eenie', 'minie']);
  });

  it('renders the tags and text from the draft', () => {
    setEditingMode(true);

    const wrapper = createBody();
    wrapper.update();

    const markdownView = wrapper.find('MarkdownView');
    const tagList = wrapper.find('TagList');
    assert.strictEqual(markdownView.props().markdown, 'this is a draft');
    assert.deepStrictEqual(tagList.props().tags, ['1', '2']);
  });

  it('does not render controls to expand/collapse the excerpt if it is not collapsible', () => {
    const wrapper = createBody();

    // By default, `isCollapsible` is `false` until changed by `Excerpt`,
    // so the expand/collapse button will not render
    assert.isFalse(wrapper.find('LabeledButton').exists());
  });

  it('renders controls to expand/collapse the excerpt if it is collapsible', () => {
    const wrapper = createBody();
    const excerpt = wrapper.find('Excerpt');

    act(() => {
      // change the `isCollapsible` state to `true` via the `Excerpt`
      excerpt.props().onCollapsibleChanged(true);
    });
    wrapper.update();

    const button = wrapper.find('LabeledButton');
    assert.isOk(button.exists());
    assert.equal(
      button.props().title,
      'Toggle visibility of full annotation text: Show More'
    );
    assert.isFalse(button.props().expanded);
  });

  it('shows appropriate button text to collapse the Excerpt if expanded', () => {
    const wrapper = createBody();
    const excerpt = wrapper.find('Excerpt');

    act(() => {
      // Get the `isCollapsible` state to `true`
      excerpt.props().onCollapsibleChanged(true);
      // Force a re-render so the button shows up
    });
    wrapper.update();

    act(() => {
      wrapper.find('LabeledButton').props().onClick();
    });
    wrapper.update();

    const buttonProps = wrapper.find('LabeledButton').props();

    assert.equal(
      buttonProps.title,
      'Toggle visibility of full annotation text: Show Less'
    );
    assert.isTrue(buttonProps.expanded);
  });

  describe('tag list and editor', () => {
    it('renders a list of tags if annotation has tags', () => {
      const wrapper = createBody();

      assert.isTrue(wrapper.find('TagList').exists());
    });

    it('does not render a tag list if annotation has no tags', () => {
      const wrapper = createBody({ annotation: fixtures.defaultAnnotation() });

      assert.isFalse(wrapper.find('TagList').exists());
    });

    it('applies theme', () => {
      const textStyle = { fontFamily: 'serif' };
      fakeApplyTheme
        .withArgs(['annotationFontFamily'], fakeSettings)
        .returns(textStyle);

      const wrapper = createBody();
      assert.deepEqual(
        wrapper.find('MarkdownView').prop('textStyle'),
        textStyle
      );
    });
  });

  it(
    'should pass a11y checks',
    checkAccessibility([
      {
        content: () => createBody(),
      },
      {
        name: 'when annotation has tags (tag list)',
        content: () => {
          const annotation = fixtures.defaultAnnotation();
          annotation.tags = ['foo', 'bar'];
          return createBody({ annotation });
        },
      },
      {
        name: 'when expandable',
        content: () => {
          const wrapper = createBody();
          act(() => {
            // change the `isCollapsible` state to `true` via the `Excerpt`
            wrapper.find('Excerpt').props().onCollapsibleChanged(true);
          });
          wrapper.update();
          return wrapper;
        },
      },
    ])
  );
});
