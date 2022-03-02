import { mount } from 'enzyme';

import * as fixtures from '../../../test/annotation-fixtures';

import { checkAccessibility } from '../../../../test-util/accessibility';
import mockImportedComponents from '../../../../test-util/mock-imported-components';

import AnnotationHeader, { $imports } from '../AnnotationHeader';

describe('AnnotationHeader', () => {
  let fakeAccountId;
  let fakeAnnotationDisplayName;
  let fakeDomainAndTitle;
  let fakeIsHighlight;
  let fakeIsReply;
  let fakeHasBeenEdited;
  let fakeIsPrivate;
  let fakeSettings;
  let fakeStore;

  const createAnnotationHeader = props => {
    return mount(
      <AnnotationHeader
        annotation={fixtures.defaultAnnotation()}
        isEditing={false}
        replyCount={0}
        threadIsCollapsed={false}
        settings={fakeSettings}
        {...props}
      />
    );
  };

  beforeEach(() => {
    fakeDomainAndTitle = sinon.stub().returns({});
    fakeIsHighlight = sinon.stub().returns(false);
    fakeIsReply = sinon.stub().returns(false);
    fakeHasBeenEdited = sinon.stub().returns(false);
    fakeIsPrivate = sinon.stub();

    fakeAccountId = {
      isThirdPartyUser: sinon.stub().returns(false),
      username: sinon.stub().returnsArg(0),
    };

    fakeAnnotationDisplayName = sinon.stub().returns('Robbie Burns');

    fakeSettings = { usernameUrl: 'http://foo.bar/' };

    fakeStore = {
      defaultAuthority: sinon.stub().returns('foo.com'),
      getLink: sinon.stub().returns('http://example.com'),
      isFeatureEnabled: sinon.stub().returns(false),
      route: sinon.stub().returns('sidebar'),
      setExpanded: sinon.stub(),
    };

    $imports.$mock(mockImportedComponents());
    $imports.$mock({
      '../../store/use-store': { useStoreProxy: () => fakeStore },
      '../../helpers/account-id': fakeAccountId,
      '../../helpers/annotation-metadata': {
        domainAndTitle: fakeDomainAndTitle,
        isHighlight: fakeIsHighlight,
        isReply: fakeIsReply,
        hasBeenEdited: fakeHasBeenEdited,
      },
      '../../helpers/annotation-user': {
        annotationDisplayName: fakeAnnotationDisplayName,
      },
      '../../helpers/permissions': {
        isPrivate: fakeIsPrivate,
      },
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  describe('only me icon', () => {
    it('should render an "Only Me" icon if the annotation is private', () => {
      fakeIsPrivate.returns(true);

      const wrapper = createAnnotationHeader();

      assert.isTrue(wrapper.find('SvgIcon').filter({ name: 'lock' }).exists());
    });

    it('should not render an "Only Me" icon if the annotation is being edited', () => {
      fakeIsPrivate.returns(true);

      const wrapper = createAnnotationHeader({ isEditing: true });

      assert.isFalse(wrapper.find('SvgIcon').filter({ name: 'lock' }).exists());
    });

    it('should not render an "Only Me" icon if the annotation is not private', () => {
      fakeIsPrivate.returns(false);

      const wrapper = createAnnotationHeader();

      assert.isFalse(wrapper.find('SvgIcon').filter({ name: 'lock' }).exists());
    });
  });

  describe('annotation author (user) information', () => {
    it('should link to author activity if first-party', () => {
      fakeAccountId.isThirdPartyUser.returns(false);

      const wrapper = createAnnotationHeader();

      assert.equal(
        wrapper.find('AnnotationUser').props().authorLink,
        'http://example.com'
      );
    });

    it('should link to author activity if third-party and has settings URL', () => {
      fakeAccountId.isThirdPartyUser.returns(true);
      const fakeAnnotation = fixtures.defaultAnnotation();

      const wrapper = createAnnotationHeader({ annotation: fakeAnnotation });

      assert.equal(
        wrapper.find('AnnotationUser').props().authorLink,
        `http://foo.bar/${fakeAnnotation.user}`
      );
    });

    it('should not link to author if third-party and no settings URL', () => {
      fakeAccountId.isThirdPartyUser.returns(true);

      const wrapper = createAnnotationHeader({ settings: {} });

      assert.isUndefined(wrapper.find('AnnotationUser').props().authorLink);
    });

    it('should pass the display name to AnnotationUser', () => {
      const wrapper = createAnnotationHeader();
      assert.equal(
        wrapper.find('AnnotationUser').props().displayName,
        'Robbie Burns'
      );
    });
  });

  describe('expand replies toggle button', () => {
    const findReplyButton = wrapper =>
      wrapper.find('LinkButton[title="Expand replies"]');

    it('should render if annotation is a collapsed reply and there are replies to show', () => {
      fakeIsReply.returns(true);
      const wrapper = createAnnotationHeader({
        replyCount: 1,
        threadIsCollapsed: true,
      });

      const btn = findReplyButton(wrapper);
      assert.isTrue(btn.exists());
    });

    it('should expand replies when clicked', () => {
      fakeIsReply.returns(true);
      const fakeAnnotation = fixtures.defaultAnnotation();
      const wrapper = createAnnotationHeader({
        annotation: fakeAnnotation,
        replyCount: 1,
        threadIsCollapsed: true,
      });

      const btn = findReplyButton(wrapper);
      btn.props().onClick();

      assert.calledOnce(fakeStore.setExpanded);
      assert.calledWith(fakeStore.setExpanded, fakeAnnotation.id, true);
    });

    it('should not render if there are no replies to show', () => {
      fakeIsReply.returns(true);
      const wrapper = createAnnotationHeader({
        threadIsCollapsed: true,
        replyCount: 0,
      });
      const btn = findReplyButton(wrapper);
      assert.isFalse(btn.exists());
    });

    it('should not render if annotation is not a reply', () => {
      fakeIsReply.returns(false);
      const wrapper = createAnnotationHeader({
        threadIsCollapsed: true,
      });
      const btn = findReplyButton(wrapper);
      assert.isFalse(btn.exists());
    });

    it('should not render if thread is not collapsed', () => {
      fakeIsReply.returns(true);
      const wrapper = createAnnotationHeader({
        threadIsCollapsed: false,
      });
      const btn = findReplyButton(wrapper);
      assert.isFalse(btn.exists());
    });

    [
      {
        replyCount: 1,
        expected: '1 reply',
      },
      {
        replyCount: 2,
        expected: '2 replies',
      },
    ].forEach(testCase => {
      it(`it should render the annotation reply count button (${testCase.replyCount})`, () => {
        fakeIsReply.returns(true);
        const wrapper = createAnnotationHeader({
          replyCount: testCase.replyCount,
          threadIsCollapsed: true,
        });
        const replyCollapseButton = findReplyButton(wrapper);
        assert.equal(replyCollapseButton.props().children, testCase.expected);
      });
    });
  });

  describe('timestamps', () => {
    it('should not render timestamps if annotation is missing `created` date', () => {
      const annotation = fixtures.defaultAnnotation();
      delete annotation.created;
      const wrapper = createAnnotationHeader({ annotation });

      const timestamp = wrapper.find('AnnotationTimestamps');

      assert.isFalse(timestamp.exists());
    });

    it('should render timestamps  if annotation has a `created` value', () => {
      const wrapper = createAnnotationHeader();
      const timestamp = wrapper.find('AnnotationTimestamps');

      assert.isTrue(timestamp.exists());
    });

    it('should render `updated` timestamp if annotation has an `updated` value', () => {
      const annotation = fixtures.defaultAnnotation();
      fakeHasBeenEdited.returns(true);

      const wrapper = createAnnotationHeader({
        annotation,
      });
      const timestamp = wrapper.find('AnnotationTimestamps');
      assert.equal(timestamp.props().withEditedTimestamp, true);
    });

    it('should not render edited timestamp if annotation has not been edited', () => {
      // Default annotation's created value is same as updated; as if the annotation
      // has not been edited before
      fakeHasBeenEdited.returns(false);
      const wrapper = createAnnotationHeader();

      const timestamp = wrapper.find('AnnotationTimestamps');
      assert.equal(timestamp.props().withEditedTimestamp, false);
    });

    it('should not render edited timestamp if annotation is collapsed reply', () => {
      fakeHasBeenEdited.returns(true);
      const annotation = fixtures.defaultAnnotation();
      annotation.updated = '2018-05-10T20:18:56.613388+00:00';
      fakeIsReply.returns(true);

      const wrapper = createAnnotationHeader({
        annotation,
        threadIsCollapsed: true,
      });

      const timestamp = wrapper.find('AnnotationTimestamps');
      assert.equal(timestamp.props().withEditedTimestamp, false);
    });
  });

  describe('extended header information', () => {
    it('should not render extended header information if annotation is reply', () => {
      fakeIsReply.returns(true);
      const wrapper = createAnnotationHeader({
        showDocumentInfo: true,
      });

      assert.isFalse(wrapper.find('AnnotationShareInfo').exists());
      assert.isFalse(wrapper.find('AnnotationDocumentInfo').exists());
    });

    describe('annotation is-highlight icon', () => {
      it('should display is-highlight icon if annotation is a highlight', () => {
        fakeIsHighlight.returns(true);
        const wrapper = createAnnotationHeader({
          isEditing: false,
        });
        const highlightIcon = wrapper.find('.AnnotationHeader__highlight');

        assert.isTrue(highlightIcon.exists());
      });

      it('should not display the is-highlight icon if annotation is not a highlight', () => {
        fakeIsHighlight.returns(false);
        const wrapper = createAnnotationHeader({
          isEditing: false,
        });
        const highlightIcon = wrapper.find('.AnnotationHeader__highlight');

        assert.isFalse(highlightIcon.exists());
      });
    });

    describe('annotation document info', () => {
      const fakeDocumentInfo = {
        titleText: 'This document',
        titleLink: 'http://www.example.com',
        domain: 'www.foo.com',
      };

      beforeEach(() => {
        fakeDomainAndTitle.returns(fakeDocumentInfo);
      });

      it('should not render document info if on sidebar route', () => {
        fakeStore.route.returns('sidebar');
        const wrapper = createAnnotationHeader();

        const documentInfo = wrapper.find('AnnotationDocumentInfo');

        assert.isFalse(documentInfo.exists());
      });

      it('should not render document info if document does not have a title', () => {
        fakeStore.route.returns('notebook');
        fakeDomainAndTitle.returns({});

        const wrapper = createAnnotationHeader();

        const documentInfo = wrapper.find('AnnotationDocumentInfo');

        assert.isFalse(documentInfo.exists());
      });

      [
        {
          route: 'notebook',
          documentInfo: fakeDocumentInfo,
          expectedPresence: true,
        },
        { route: 'notebook', documentInfo: {}, expectedPresence: false },
        {
          route: 'sidebar',
          documentInfo: fakeDocumentInfo,
          expectedPresence: false,
        },
      ].forEach(testCase => {
        it('should render document info if document info available and not on sidebar route', () => {
          fakeStore.route.returns(testCase.route);
          fakeDomainAndTitle.returns(testCase.documentInfo);

          const wrapper = createAnnotationHeader();
          const documentInfo = wrapper.find('AnnotationDocumentInfo');

          assert.equal(documentInfo.exists(), testCase.expectedPresence);
        });
      });

      it('should set document properties as props to `AnnotationDocumentInfo`', () => {
        fakeStore.route.returns('notebook');
        const wrapper = createAnnotationHeader();

        const documentInfo = wrapper.find('AnnotationDocumentInfo');

        assert.isTrue(documentInfo.exists());
        assert.equal(documentInfo.props().title, 'This document');
        // Link is not set because Annotation prop (default fixture) doesn't
        // have a URL (html link)
        assert.equal(documentInfo.props().link, '');
        assert.equal(documentInfo.props().domain, 'www.foo.com');
      });

      it('should provide document link for document info if annotation has an HTML link/URL', () => {
        const annotation = fixtures.defaultAnnotation();
        annotation.links = { html: 'http://www.whatever' };
        fakeStore.route.returns('notebook');
        const wrapper = createAnnotationHeader({ annotation });

        const documentInfo = wrapper.find('AnnotationDocumentInfo');

        assert.equal(documentInfo.props().link, 'http://www.example.com');
      });
    });
  });

  context('user is editing annotation', () => {
    it('should not display timestamp', () => {
      const wrapper = createAnnotationHeader({
        annotation: fixtures.defaultAnnotation(),
        isEditing: true,
      });

      const timestamp = wrapper.find('AnnotationTimestamps');

      assert.isFalse(timestamp.exists());
    });

    it('should not display is-highlight icon', () => {
      const wrapper = createAnnotationHeader({
        annotation: fixtures.defaultAnnotation(),
        isEditing: true,
        isHighlight: true,
      });
      const highlight = wrapper.find('.AnnotationHeader__highlight');

      assert.isFalse(highlight.exists());
    });
  });

  it(
    'should pass a11y checks',
    checkAccessibility([
      {
        name: 'not editing',
        content: () =>
          createAnnotationHeader({
            annotation: fixtures.defaultAnnotation(),
            isEditing: false,
          }),
      },
      {
        name: 'editing',
        content: () =>
          createAnnotationHeader({
            annotation: fixtures.defaultAnnotation(),
            isEditing: true,
          }),
      },
    ])
  );
});
