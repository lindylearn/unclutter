import { mount } from 'enzyme';

import * as fixtures from '../../../test/annotation-fixtures';

import { checkAccessibility } from '../../../../test-util/accessibility';
import mockImportedComponents from '../../../../test-util/mock-imported-components';

import Annotation, { $imports } from '../Annotation';

describe('Annotation', () => {
  let fakeOnToggleReplies;

  // Dependency Mocks
  let fakeMetadata;

  // Injected dependency mocks
  let fakeAnnotationsService;
  let fakeStore;

  const setEditingMode = (isEditing = true) => {
    // The presence of a draft will make `isEditing` `true`
    if (isEditing) {
      fakeStore.getDraft.returns(fixtures.defaultDraft());
    } else {
      fakeStore.getDraft.returns(null);
    }
  };

  const createComponent = props => {
    return mount(
      <Annotation
        annotation={fixtures.defaultAnnotation()}
        annotationsService={fakeAnnotationsService}
        hasAppliedFilter={false}
        isReply={false}
        onToggleReplies={fakeOnToggleReplies}
        replyCount={0}
        threadIsCollapsed={true}
        {...props}
      />
    );
  };

  beforeEach(() => {
    fakeOnToggleReplies = sinon.stub();

    fakeAnnotationsService = {
      reply: sinon.stub(),
      save: sinon.stub().resolves(),
    };

    fakeMetadata = {
      quote: sinon.stub(),
    };

    fakeStore = {
      getDraft: sinon.stub().returns(null),
      isAnnotationFocused: sinon.stub().returns(false),
      isSavingAnnotation: sinon.stub().returns(false),
      profile: sinon.stub().returns({ userid: 'acct:foo@bar.com' }),
      setExpanded: sinon.stub(),
    };

    $imports.$mock(mockImportedComponents());
    $imports.$mock({
      '../../helpers/annotation-metadata': fakeMetadata,
      '../../store/use-store': { useStoreProxy: () => fakeStore },
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  describe('annotation classnames', () => {
    it('should assign a reply class if the annotation is a reply', () => {
      const wrapper = createComponent({
        isReply: true,
        threadIsCollapsed: false,
      });
      const annot = wrapper.find('.Annotation');

      assert.isTrue(annot.hasClass('Annotation--reply'));
      assert.isFalse(annot.hasClass('is-collapsed'));
    });

    it('applies a focused class if annotation is focused', () => {
      fakeStore.isAnnotationFocused.returns(true);
      const wrapper = createComponent({ threadIsCollapsed: false });
      const annot = wrapper.find('.Annotation');

      assert.isTrue(annot.hasClass('is-focused'));
    });

    it('should assign a collapsed class if the annotation thread is collapsed', () => {
      const wrapper = createComponent({ threadIsCollapsed: true });
      const annot = wrapper.find('.Annotation');

      assert.isTrue(annot.hasClass('is-collapsed'));
    });
  });

  describe('annotation quote', () => {
    it('renders quote if annotation has a quote', () => {
      fakeMetadata.quote.returns('quote');
      const wrapper = createComponent();

      const quote = wrapper.find('AnnotationQuote');
      assert.isTrue(quote.exists());
    });

    it('sets the quote to "focused" if annotation is currently focused', () => {
      fakeStore.isAnnotationFocused.returns(true);
      fakeMetadata.quote.returns('quote');
      const wrapper = createComponent();

      assert.isTrue(wrapper.find('AnnotationQuote').props().isFocused);
    });

    it('does not render quote if annotation does not have a quote', () => {
      fakeMetadata.quote.returns(null);

      const wrapper = createComponent();

      const quote = wrapper.find('AnnotationQuote');
      assert.isFalse(quote.exists());
    });
  });

  it('should show a "Saving" message when annotation is saving', () => {
    fakeStore.isSavingAnnotation.returns(true);

    const wrapper = createComponent();

    assert.include(wrapper.find('.Annotation__actions').text(), 'Saving...');
  });

  describe('reply thread toggle', () => {
    it('should render a toggle button if the annotation has replies', () => {
      const wrapper = createComponent({
        replyCount: 5,
        threadIsCollapsed: true,
      });

      const toggle = wrapper.find('AnnotationReplyToggle');

      assert.isTrue(toggle.exists());
      assert.equal(toggle.props().onToggleReplies, fakeOnToggleReplies);
      assert.equal(toggle.props().replyCount, 5);
      assert.equal(toggle.props().threadIsCollapsed, true);
    });

    it('should not render a reply toggle if the annotation has no replies', () => {
      const wrapper = createComponent({
        isReply: false,
        replyCount: 0,
        threadIsCollapsed: true,
      });

      assert.isFalse(wrapper.find('AnnotationReplyToggle').exists());
    });

    it('should not render a reply toggle if there are applied filters', () => {
      const wrapper = createComponent({
        hasAppliedFilter: true,
        isReply: false,
        replyCount: 5,
        threadIsCollapsed: true,
      });

      assert.isFalse(wrapper.find('AnnotationReplyToggle').exists());
    });

    it('should not render a reply toggle if the annotation itself is a reply', () => {
      const wrapper = createComponent({
        isReply: true,
        replyCount: 5,
        threadIsCollapsed: true,
      });

      assert.isFalse(wrapper.find('AnnotationReplyToggle').exists());
    });
  });

  describe('annotation actions', () => {
    describe('replying to an annotation', () => {
      it('should create a reply', () => {
        const theAnnot = fixtures.defaultAnnotation();
        const wrapper = createComponent({ annotation: theAnnot });

        wrapper.find('AnnotationActionBar').props().onReply();

        assert.calledOnce(fakeAnnotationsService.reply);
        assert.calledWith(
          fakeAnnotationsService.reply,
          theAnnot,
          'acct:foo@bar.com'
        );
      });
    });

    it('should show annotation actions', () => {
      const wrapper = createComponent();

      assert.isTrue(wrapper.find('AnnotationActionBar').exists());
    });

    it('should not show annotation actions when editing', () => {
      setEditingMode(true);

      const wrapper = createComponent();

      assert.isFalse(wrapper.find('AnnotationActionBar').exists());
    });
  });

  context('annotation thread is collapsed', () => {
    context('collapsed reply', () => {
      it('should not render body or footer', () => {
        const wrapper = createComponent({
          isReply: true,
          threadIsCollapsed: true,
        });

        assert.isFalse(wrapper.find('AnnotationBody').exists());
        assert.isFalse(wrapper.find('footer').exists());
      });

      it('should not show actions', () => {
        const wrapper = createComponent({
          isReply: true,
          threadIsCollapsed: true,
        });

        assert.isFalse(wrapper.find('AnnotationActionBar').exists());
      });
    });

    context('collapsed top-level annotation', () => {
      it('should render body and footer', () => {
        const wrapper = createComponent({
          isReply: false,
          threadIsCollapsed: true,
        });

        assert.isTrue(wrapper.find('AnnotationBody').exists());
        assert.isTrue(wrapper.find('footer').exists());
      });
    });

    context('missing annotation', () => {
      it('should render a message about annotation unavailability', () => {
        const wrapper = createComponent({ annotation: undefined });

        assert.equal(wrapper.text(), 'Message not available.');
      });

      it('should not render a message if collapsed reply', () => {
        const wrapper = createComponent({
          annotation: undefined,
          isReply: true,
          threadIsCollapsed: true,
        });

        assert.equal(wrapper.text(), '');
      });

      it('should render reply toggle controls if there are replies', () => {
        const wrapper = createComponent({
          annotation: undefined,
          replyCount: 5,
          threadIsCollapsed: true,
        });

        const toggle = wrapper.find('AnnotationReplyToggle');

        assert.isTrue(toggle.exists());
        assert.equal(toggle.props().onToggleReplies, fakeOnToggleReplies);
        assert.equal(toggle.props().replyCount, 5);
        assert.equal(toggle.props().threadIsCollapsed, true);
      });

      it('should not render reply toggle controls if collapsed reply', () => {
        const wrapper = createComponent({
          annotation: undefined,
          isReply: true,
          replyCount: 5,
          threadIsCollapsed: true,
        });

        const toggle = wrapper.find('AnnotationReplyToggle');

        assert.isFalse(toggle.exists());
      });
    });
  });

  it(
    'should pass a11y checks',
    checkAccessibility([
      {
        content: () => createComponent(),
      },
      {
        name: 'When editing',
        content: () => {
          setEditingMode(true);
          return createComponent();
        },
      },
      {
        name: 'when a collapsed top-level thread',
        content: () => {
          return createComponent({ isReply: false, threadIsCollapsed: true });
        },
      },
      {
        name: 'when a collapsed reply',
        content: () => {
          return createComponent({ isReply: true, threadIsCollapsed: true });
        },
      },
    ])
  );
});
