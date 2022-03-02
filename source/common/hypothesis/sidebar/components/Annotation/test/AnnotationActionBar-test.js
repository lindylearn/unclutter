import { mount } from 'enzyme';
import { act } from 'preact/test-utils';

import AnnotationActionBar from '../AnnotationActionBar';
import { $imports } from '../AnnotationActionBar';

import * as fixtures from '../../../test/annotation-fixtures';

import { checkAccessibility } from '../../../../test-util/accessibility';
import mockImportedComponents from '../../../../test-util/mock-imported-components';
import { waitFor } from '../../../../test-util/wait';

describe('AnnotationActionBar', () => {
  let fakeAnnotation;
  let fakeConfirm;
  let fakeOnReply;
  let fakeUserProfile;

  // Fake services
  let fakeAnnotationsService;
  let fakeToastMessenger;
  let fakePermits;
  let fakeSettings;
  // Fake dependencies
  let fakeAnnotationSharingLink;
  let fakeSharingEnabled;
  let fakeStore;

  function createComponent(props = {}) {
    return mount(
      <AnnotationActionBar
        annotation={fakeAnnotation}
        annotationsService={fakeAnnotationsService}
        toastMessenger={fakeToastMessenger}
        onReply={fakeOnReply}
        settings={fakeSettings}
        {...props}
      />
    );
  }

  const allowOnly = action => {
    fakePermits.returns(false);
    fakePermits
      .withArgs(sinon.match.any, action, sinon.match.any)
      .returns(true);
  };

  const disallowOnly = action => {
    fakePermits
      .withArgs(sinon.match.any, action, sinon.match.any)
      .returns(false);
  };

  const getButton = (wrapper, iconName) => {
    return wrapper.find('IconButton').filter({ icon: iconName });
  };

  beforeEach(() => {
    fakeAnnotation = fixtures.defaultAnnotation();
    fakeUserProfile = {
      userid: 'account:foo@bar.com',
    };

    fakeAnnotationsService = {
      delete: sinon.stub().resolves(),
      flag: sinon.stub().resolves(),
    };

    fakeToastMessenger = {
      error: sinon.stub(),
    };

    fakeOnReply = sinon.stub();

    fakePermits = sinon.stub().returns(true);
    fakeSettings = {};

    fakeSharingEnabled = sinon.stub().returns(true);
    fakeAnnotationSharingLink = sinon.stub().returns('http://share.me');

    fakeStore = {
      createDraft: sinon.stub(),
      getGroup: sinon.stub().returns({}),
      isLoggedIn: sinon.stub(),
      openSidebarPanel: sinon.stub(),
      profile: sinon.stub().returns(fakeUserProfile),
    };

    fakeConfirm = sinon.stub().resolves(false);

    $imports.$mock(mockImportedComponents());
    $imports.$mock({
      '../../helpers/annotation-sharing': {
        sharingEnabled: fakeSharingEnabled,
        annotationSharingLink: fakeAnnotationSharingLink,
      },
      '../../helpers/permissions': { permits: fakePermits },
      '../../store/use-store': { useStoreProxy: () => fakeStore },
      '../../../shared/prompts': { confirm: fakeConfirm },
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  describe('edit action button', () => {
    it('shows edit button if permissions allow', () => {
      allowOnly('update');
      const wrapper = createComponent();

      assert.isTrue(getButton(wrapper, 'edit').exists());
    });

    it('creates a new draft when `Edit` button clicked', () => {
      allowOnly('update');
      const button = getButton(createComponent(), 'edit');

      button.props().onClick();

      const call = fakeStore.createDraft.getCall(0);
      assert.calledOnce(fakeStore.createDraft);
      assert.equal(call.args[0], fakeAnnotation);
      assert.include(call.args[1], {
        isPrivate: false,
        text: fakeAnnotation.text,
      });
      assert.isArray(call.args[1].tags);
    });

    it('does not show edit button if permissions do not allow', () => {
      disallowOnly('update');

      const wrapper = createComponent();

      assert.isFalse(getButton(wrapper, 'edit').exists());
    });
  });

  describe('delete action button', () => {
    it('shows delete button if permissions allow', () => {
      allowOnly('delete');
      const wrapper = createComponent();

      assert.isTrue(getButton(wrapper, 'trash').exists());
    });

    it('asks for confirmation before deletion', async () => {
      allowOnly('delete');
      const button = getButton(createComponent(), 'trash');

      await act(async () => {
        await button.props().onClick();
      });

      assert.calledOnce(fakeConfirm);
      assert.notCalled(fakeAnnotationsService.delete);
    });

    it('invokes delete on service when confirmed', async () => {
      allowOnly('delete');
      fakeConfirm.resolves(true);
      const button = getButton(createComponent(), 'trash');

      await act(async () => {
        await button.props().onClick();
      });

      assert.calledWith(fakeAnnotationsService.delete, fakeAnnotation);
    });

    it('sets a flash message if there is an error with deletion', async () => {
      allowOnly('delete');
      fakeConfirm.resolves(true);
      fakeAnnotationsService.delete.rejects();

      const button = getButton(createComponent(), 'trash');
      await act(async () => {
        await button.props().onClick();
      });

      await waitFor(() => fakeToastMessenger.error.called);
    });
  });

  describe('edit action button', () => {
    it('does not show edit button if permissions do not allow', () => {
      disallowOnly('delete');

      const wrapper = createComponent();

      assert.isFalse(getButton(wrapper, 'trash').exists());
    });
  });

  describe('reply action button', () => {
    it('shows the reply button (in all cases)', () => {
      const wrapper = createComponent();

      assert.isTrue(getButton(wrapper, 'reply').exists());
    });

    describe('when clicked', () => {
      it('shows login prompt if user is not logged in', () => {
        fakeStore.isLoggedIn.returns(false);
        const button = getButton(createComponent(), 'reply');

        act(() => {
          button.props().onClick();
        });

        assert.calledWith(fakeStore.openSidebarPanel, 'loginPrompt');
        assert.notCalled(fakeOnReply);
      });

      it('invokes `onReply` callback if user is logged in', () => {
        fakeStore.isLoggedIn.returns(true);
        const button = getButton(createComponent(), 'reply');

        act(() => {
          button.props().onClick();
        });

        assert.calledOnce(fakeOnReply);
        assert.notCalled(fakeStore.openSidebarPanel);
      });
    });
  });

  describe('share action button', () => {
    it('shows share action button if annotation is shareable', () => {
      const wrapper = createComponent();

      assert.isTrue(wrapper.find('AnnotationShareControl').exists());
    });

    it('does not show share action button if sharing is not enabled', () => {
      fakeSharingEnabled.returns(false);
      const wrapper = createComponent();

      assert.isFalse(wrapper.find('AnnotationShareControl').exists());
    });

    it('does not show share action button if annotation lacks sharing URI', () => {
      fakeAnnotationSharingLink.returns(undefined);
      const wrapper = createComponent();

      assert.isFalse(wrapper.find('AnnotationShareControl').exists());
    });
  });

  describe('flag action button', () => {
    it('hides flag button if user is not authenticated', () => {
      fakeStore.profile.returns({
        userid: null,
      });

      const wrapper = createComponent();

      assert.isFalse(getButton(wrapper, 'flag').exists());
    });

    it('hides flag button if user is author', () => {
      fakeAnnotation.user = fakeUserProfile.userid;

      const wrapper = createComponent();

      assert.isFalse(getButton(wrapper, 'flag').exists());
    });

    it('hides flag button if flagging is disabled in the settings', () => {
      fakeSettings = { services: [{ allowFlagging: false }] };
      const wrapper = createComponent();

      assert.isFalse(getButton(wrapper, 'flag').exists());
    });

    it('shows flag button if user is not author', () => {
      const wrapper = createComponent();

      assert.isTrue(getButton(wrapper, 'flag').exists());
    });

    it('invokes flag on service when clicked', () => {
      const button = getButton(createComponent(), 'flag');

      act(() => {
        button.props().onClick();
      });

      assert.calledWith(fakeAnnotationsService.flag, fakeAnnotation);
    });

    it('sets flash error message if flagging fails on service', async () => {
      fakeAnnotationsService.flag.rejects();

      const button = getButton(createComponent(), 'flag');

      act(() => {
        button.props().onClick();
      });

      await waitFor(() => fakeToastMessenger.error.called);
    });

    context('previously-flagged annotation', () => {
      beforeEach(() => {
        fakeAnnotation.flagged = true;
      });

      it('renders an active-state flag action button', () => {
        const wrapper = createComponent();

        assert.isTrue(getButton(wrapper, 'flag--active').exists());
      });

      it('does not set an `onClick` property for the flag action button', () => {
        const button = getButton(createComponent(), 'flag--active');

        assert.isUndefined(button.props().onClick);
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
