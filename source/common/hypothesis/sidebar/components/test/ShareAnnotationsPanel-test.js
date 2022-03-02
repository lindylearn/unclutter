import { mount } from 'enzyme';

import ShareAnnotationsPanel from '../ShareAnnotationsPanel';
import { $imports } from '../ShareAnnotationsPanel';

import { checkAccessibility } from '../../../test-util/accessibility';
import mockImportedComponents from '../../../test-util/mock-imported-components';

describe('ShareAnnotationsPanel', () => {
  let fakeStore;
  let fakeBouncerLink;
  let fakePageSharingLink;
  let fakeToastMessenger;
  let fakeCopyToClipboard;

  const fakePrivateGroup = {
    type: 'private',
    name: 'Test Private Group',
    id: 'testprivate',
  };

  const createShareAnnotationsPanel = props =>
    mount(
      <ShareAnnotationsPanel toastMessenger={fakeToastMessenger} {...props} />
    );

  beforeEach(() => {
    fakeBouncerLink = 'http://hyp.is/go?url=http%3A%2F%2Fwww.example.com';
    fakeCopyToClipboard = {
      copyText: sinon.stub(),
    };

    fakePageSharingLink = sinon.stub().returns(fakeBouncerLink);
    fakeToastMessenger = {
      success: sinon.stub(),
      error: sinon.stub(),
    };

    fakeStore = {
      focusedGroup: sinon.stub().returns(fakePrivateGroup),
      mainFrame: () => ({
        uri: 'https://www.example.com',
      }),
    };

    $imports.$mock(mockImportedComponents());
    $imports.$mock({
      '../store/use-store': { useStoreProxy: () => fakeStore },
      '../helpers/annotation-sharing': {
        pageSharingLink: fakePageSharingLink,
      },
      '../util/copy-to-clipboard': fakeCopyToClipboard,
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  describe('panel title', () => {
    it("sets sidebar panel title to include group's name", () => {
      const wrapper = createShareAnnotationsPanel();

      assert.equal(
        wrapper.find('SidebarPanel').prop('title'),
        'Share Annotations in Test Private Group'
      );
    });

    it('sets a temporary title if focused group not available', () => {
      fakeStore.focusedGroup = sinon.stub().returns({});

      const wrapper = createShareAnnotationsPanel();
      assert.equal(
        wrapper.find('SidebarPanel').prop('title'),
        'Share Annotations in ...'
      );
    });
  });

  describe('panel content', () => {
    it('does not render panel content if needed info not available', () => {
      fakeStore.focusedGroup.returns(undefined);

      const wrapper = createShareAnnotationsPanel();
      assert.isFalse(wrapper.exists('.ShareAnnotationsPanel'));
    });

    it('renders a spinner if focused group not available yet', () => {
      fakeStore.focusedGroup.returns(undefined);

      const wrapper = createShareAnnotationsPanel();
      assert.isTrue(wrapper.find('Spinner').exists());
    });

    it('renders panel content if needed info available', () => {
      const wrapper = createShareAnnotationsPanel();
      assert.isTrue(wrapper.exists('.ShareAnnotationsPanel'));
      assert.isFalse(wrapper.find('Spinner').exists());
    });
  });

  [
    {
      groupType: 'private',
      introPattern: /Use this link.*with other group members/,
      visibilityPattern:
        /Annotations in the private group.*are only visible to group members/,
    },
    {
      groupType: 'restricted',
      introPattern: /Use this link to share these annotations with anyone/,
      visibilityPattern:
        /Anyone using this link may view the annotations in the group/,
    },
    {
      groupType: 'open',
      introPattern: /Use this link to share these annotations with anyone/,
      visibilityPattern:
        /Anyone using this link may view the annotations in the group/,
    },
  ].forEach(testCase => {
    it('it displays appropriate help text depending on group type', () => {
      fakeStore.focusedGroup.returns({
        type: testCase.groupType,
        name: 'Test Group',
        id: 'testid,',
      });

      const wrapper = createShareAnnotationsPanel();

      assert.match(
        wrapper.find('.ShareAnnotationsPanel__intro').text(),
        testCase.introPattern
      );

      assert.match(
        wrapper.find('.ShareAnnotationsPanel').text(),
        testCase.visibilityPattern
      );
    });

    context('document URI cannot be shared', () => {
      it('renders explanatory text about inability to share', () => {
        fakePageSharingLink.returns(null);

        const wrapper = createShareAnnotationsPanel();

        const panelEl = wrapper.find('.ShareAnnotationsPanel');
        assert.include(panelEl.text(), 'These annotations cannot be shared');
      });
    });
  });

  describe('web share link', () => {
    it('displays web share link in readonly form input', () => {
      const wrapper = createShareAnnotationsPanel();

      const inputEl = wrapper.find('input');
      assert.equal(inputEl.prop('value'), fakeBouncerLink);
      assert.equal(inputEl.prop('readOnly'), true);
    });

    context('document URI cannot be shared', () => {
      it('does not render an input field with share link', () => {
        fakePageSharingLink.returns(null);
        const wrapper = createShareAnnotationsPanel();

        const inputEl = wrapper.find('input');
        assert.isFalse(inputEl.exists());
      });
    });

    describe('copy link to clipboard', () => {
      it('copies link to clipboard when copy button clicked', () => {
        const wrapper = createShareAnnotationsPanel();

        wrapper.find('IconButton').props().onClick();

        assert.calledWith(fakeCopyToClipboard.copyText, fakeBouncerLink);
      });

      it('confirms link copy when successful', () => {
        const wrapper = createShareAnnotationsPanel();

        wrapper.find('IconButton').props().onClick();

        assert.calledWith(
          fakeToastMessenger.success,
          'Copied share link to clipboard'
        );
      });

      it('flashes an error if link copying unsuccessful', () => {
        fakeCopyToClipboard.copyText.throws();
        const wrapper = createShareAnnotationsPanel();

        wrapper.find('IconButton').props().onClick();

        assert.calledWith(fakeToastMessenger.error, 'Unable to copy link');
      });
    });
  });

  it(
    'should pass a11y checks',
    checkAccessibility({
      content: () => createShareAnnotationsPanel(),
    })
  );
});
