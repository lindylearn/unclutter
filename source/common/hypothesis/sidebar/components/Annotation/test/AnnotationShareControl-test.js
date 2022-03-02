import { mount } from 'enzyme';
import { act } from 'preact/test-utils';

import { checkAccessibility } from '../../../../test-util/accessibility';
import mockImportedComponents from '../../../../test-util/mock-imported-components';

import AnnotationShareControl, { $imports } from '../AnnotationShareControl';

describe('AnnotationShareControl', () => {
  let fakeAnnotation;
  let fakeCopyToClipboard;
  let fakeToastMessenger;
  let fakeGroup;
  let fakeIsPrivate;
  let fakeIsShareableURI;
  let fakeShareUri;
  let fakeIsIOS;

  let container;

  const getIconButton = (wrapper, iconName) => {
    return wrapper.find('IconButton').filter({ icon: iconName });
  };

  function createComponent(props = {}) {
    return mount(
      <AnnotationShareControl
        annotation={fakeAnnotation}
        toastMessenger={fakeToastMessenger}
        group={fakeGroup}
        shareUri={fakeShareUri}
        {...props}
      />,
      { attachTo: container }
    );
  }

  function openElement(wrapper) {
    act(() => {
      wrapper.find('IconButton').props().onClick();
    });
    wrapper.update();
  }

  function isLinkInputFocused() {
    return (
      document.activeElement.getAttribute('aria-label') ===
      'Use this URL to share this annotation'
    );
  }

  beforeEach(() => {
    // This extra element is necessary to test automatic `focus`-ing
    // of the component's `input` element
    container = document.createElement('div');
    document.body.appendChild(container);

    fakeAnnotation = {
      group: 'fakegroup',
      permissions: {},
      user: 'acct:bar@foo.com',
      uri: 'http://www.example.com',
    };

    fakeCopyToClipboard = {
      copyText: sinon.stub(),
    };
    fakeToastMessenger = {
      success: sinon.stub(),
      error: sinon.stub(),
    };
    fakeGroup = {
      name: 'My Group',
      type: 'private',
    };
    fakeIsPrivate = sinon.stub().returns(false);
    fakeIsShareableURI = sinon.stub().returns(true);
    fakeShareUri = 'https://www.example.com';
    fakeIsIOS = sinon.stub().returns(false);

    $imports.$mock(mockImportedComponents());
    $imports.$mock({
      '@hypothesis/frontend-shared': {
        useElementShouldClose: sinon.stub(),
      },
      '../../helpers/annotation-sharing': {
        isShareableURI: fakeIsShareableURI,
      },
      '../../util/copy-to-clipboard': fakeCopyToClipboard,
      '../../helpers/permissions': { isPrivate: fakeIsPrivate },
      '../../../shared/user-agent': { isIOS: fakeIsIOS },
    });
  });

  afterEach(() => {
    $imports.$restore();
    container.remove();
  });

  it('does not render component if `group` prop not OK', () => {
    const wrapper = createComponent({ group: undefined });
    assert.equal(wrapper.html(), '');
  });

  it('does not render content when not open', () => {
    const wrapper = createComponent();

    // Component is not `open` initially
    assert.isFalse(wrapper.find('.annotation-share-panel').exists());
  });

  it('toggles the share control element when the button is clicked', () => {
    const wrapper = createComponent();
    const button = getIconButton(wrapper, 'share');

    act(() => {
      button.props().onClick();
    });
    wrapper.update();

    assert.isTrue(wrapper.find('.annotation-share-panel').exists());
  });

  it('renders the share URI in a readonly input field', () => {
    const wrapper = createComponent();
    openElement(wrapper);

    const inputEl = wrapper.find('input');
    assert.equal(inputEl.prop('value'), fakeShareUri);
    assert.isTrue(inputEl.prop('readOnly'));
  });

  describe('copying the share URI to the clipboard', () => {
    it('copies the share link to the clipboard when the copy button is clicked', () => {
      const wrapper = createComponent();
      openElement(wrapper);

      getIconButton(wrapper, 'copy').props().onClick();

      assert.calledWith(
        fakeCopyToClipboard.copyText,
        'https://www.example.com'
      );
    });

    it('confirms link copy when successful', () => {
      const wrapper = createComponent();
      openElement(wrapper);

      getIconButton(wrapper, 'copy').props().onClick();

      assert.calledWith(
        fakeToastMessenger.success,
        'Copied share link to clipboard'
      );
    });

    it('flashes an error if link copying unsuccessful', () => {
      fakeCopyToClipboard.copyText.throws();
      const wrapper = createComponent();
      openElement(wrapper);

      getIconButton(wrapper, 'copy').props().onClick();

      assert.calledWith(fakeToastMessenger.error, 'Unable to copy link');
    });
  });

  [
    {
      groupType: 'private',
      isPrivate: false,
      expected: 'Only members of the group My Group may view this annotation.',
    },
    {
      groupType: 'open',
      isPrivate: false,
      expected: 'Anyone using this link may view this annotation.',
    },
    {
      groupType: 'private',
      isPrivate: true,
      expected: 'Only you may view this annotation.',
    },
    {
      groupType: 'open',
      isPrivate: true,
      expected: 'Only you may view this annotation.',
    },
  ].forEach(testcase => {
    it(`renders the correct sharing information for a ${testcase.groupType} group when annotation privacy is ${testcase.isPrivate}`, () => {
      fakeIsPrivate.returns(testcase.isPrivate);
      fakeGroup.type = testcase.groupType;
      const wrapper = createComponent({ isPrivate: testcase.isPrivate });
      openElement(wrapper);

      const permissionsEl = wrapper.find('.annotation-share-panel__details');
      assert.equal(permissionsEl.text(), testcase.expected);
    });
  });

  it('renders an explanation if annotation cannot be shared in context', () => {
    fakeIsShareableURI.returns(false);
    const wrapper = createComponent();
    openElement(wrapper);

    const detailsEl = wrapper.find('.annotation-share-panel__details');
    assert.include(
      detailsEl.text(),
      'This annotation cannot be shared in its original context'
    );
  });

  it('renders share links if annotation can be shared in context', () => {
    const wrapper = createComponent();
    openElement(wrapper);

    assert.isTrue(wrapper.find('ShareLinks').exists());
  });

  it('does not render share links if annotation cannot be shared in context', () => {
    fakeIsShareableURI.returns(false);
    const wrapper = createComponent();
    openElement(wrapper);

    assert.isFalse(wrapper.find('ShareLinks').exists());
  });

  it('focuses the share-URI input when opened on non-iOS', () => {
    const wrapper = createComponent();
    openElement(wrapper);
    wrapper.update();

    assert.isTrue(isLinkInputFocused());
  });

  it("doesn't focuses the share-URI input when opened on iOS", () => {
    fakeIsIOS.returns(true);
    const wrapper = createComponent();
    openElement(wrapper);
    wrapper.update();

    assert.isFalse(isLinkInputFocused());
  });

  it(
    'should pass a11y checks',
    checkAccessibility(
      {
        name: 'when closed',
        content: () => createComponent(),
      },
      {
        name: 'when open',
        content: () => {
          const wrapper = createComponent();
          openElement(wrapper);
          wrapper.update();
          return wrapper;
        },
      }
    )
  );
});
