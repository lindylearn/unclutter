import { mount } from 'enzyme';
import { act } from 'preact/test-utils';

import mockImportedComponents from '../../../test-util/mock-imported-components';

import ToastMessages, { $imports } from '../ToastMessages';
import { checkAccessibility } from '../../../test-util/accessibility';

describe('ToastMessages', () => {
  let fakeStore;
  let fakeToastMessenger;

  let fakeErrorMessage = () => {
    return {
      type: 'error',
      message: 'boo',
      id: 'someid2',
      isDismissed: false,
    };
  };

  let fakeSuccessMessage = () => {
    return {
      type: 'success',
      message: 'yay',
      id: 'someid',
      isDismissed: false,
    };
  };

  let fakeNoticeMessage = () => {
    return {
      type: 'notice',
      message: 'you should know...',
      id: 'someid3',
      isDismissed: false,
      moreInfoURL: 'http://www.example.com',
    };
  };

  function createComponent(props) {
    return mount(
      <ToastMessages toastMessenger={fakeToastMessenger} {...props} />
    );
  }

  beforeEach(() => {
    fakeStore = {
      getToastMessages: sinon.stub(),
    };

    fakeToastMessenger = {
      dismiss: sinon.stub(),
    };

    $imports.$mock(mockImportedComponents());
    $imports.$mock({
      '../store/use-store': { useStoreProxy: () => fakeStore },
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  it('should render a `ToastMessage` for each message returned by the store', () => {
    fakeStore.getToastMessages.returns([
      fakeSuccessMessage(),
      fakeErrorMessage(),
      fakeNoticeMessage(),
    ]);

    const wrapper = createComponent();

    assert.lengthOf(wrapper.find('ToastMessage'), 3);
  });

  describe('`ToastMessage` sub-component', () => {
    it('should add `is-dismissed` stateful class name if message has been dismissed', () => {
      const message = fakeSuccessMessage();
      message.isDismissed = true;
      fakeStore.getToastMessages.returns([message]);

      const wrapper = createComponent();
      const messageContainer = wrapper.find('ToastMessage li');

      assert.isTrue(messageContainer.hasClass('is-dismissed'));
    });

    it('should dismiss the message when clicked', () => {
      fakeStore.getToastMessages.returns([fakeSuccessMessage()]);

      const wrapper = createComponent();

      const messageContainer = wrapper.find('ToastMessage li');

      act(() => {
        messageContainer.simulate('click');
      });

      assert.calledOnce(fakeToastMessenger.dismiss);
    });

    it('should not dismiss the message if a "More info" link is clicked', () => {
      fakeStore.getToastMessages.returns([fakeNoticeMessage()]);

      const wrapper = createComponent();

      const link = wrapper.find('.toast-message__link a');

      act(() => {
        link.getDOMNode().dispatchEvent(new Event('click', { bubbles: true }));
      });

      assert.notCalled(fakeToastMessenger.dismiss);
    });

    [
      { message: fakeSuccessMessage(), className: 'toast-message--success' },
      { message: fakeErrorMessage(), className: 'toast-message--error' },
      { message: fakeNoticeMessage(), className: 'toast-message--notice' },
    ].forEach(testCase => {
      it('should assign a CSS class based on message type', () => {
        fakeStore.getToastMessages.returns([testCase.message]);

        const wrapper = createComponent();

        const messageWrapper = wrapper.find('.toast-message');

        assert.isTrue(messageWrapper.hasClass(testCase.className));
      });

      [
        { message: fakeSuccessMessage(), prefix: 'Success' },
        { message: fakeErrorMessage(), prefix: 'Error' },
      ].forEach(testCase => {
        it('should prefix the message with the message type', () => {
          fakeStore.getToastMessages.returns([testCase.message]);

          const wrapper = createComponent();

          const messageContent = wrapper
            .find('.toast-message__message')
            .first();

          assert.equal(
            messageContent.text(),
            `${testCase.prefix}: ${testCase.message.message}`
          );
        });
      });
    });

    [
      { messages: [fakeSuccessMessage()], icons: ['success'] },
      { messages: [fakeErrorMessage()], icons: ['error'] },
      { messages: [fakeNoticeMessage()], icons: ['cancel'] },
      {
        messages: [fakeSuccessMessage(), fakeErrorMessage()],
        icons: ['success', 'error'],
      },
    ].forEach(testCase => {
      it('should render an appropriate icon for the message type', () => {
        fakeStore.getToastMessages.returns(testCase.messages);

        const wrapper = createComponent();

        const iconProps = wrapper
          .find('SvgIcon')
          .map(iconWrapper => iconWrapper.props().name);

        assert.deepEqual(iconProps, testCase.icons);
      });
    });
  });

  it('should render a "more info" link if URL is present in message object', () => {
    fakeStore.getToastMessages.returns([fakeNoticeMessage()]);

    const wrapper = createComponent();

    const link = wrapper.find('.toast-message__link a');
    assert.equal(link.props().href, 'http://www.example.com');
    assert.equal(link.text(), 'More info');
  });

  describe('a11y', () => {
    beforeEach(() => {
      fakeStore.getToastMessages.returns([
        fakeSuccessMessage(),
        fakeErrorMessage(),
        fakeNoticeMessage(),
      ]);
    });

    it(
      'should pass a11y checks',
      checkAccessibility([
        {
          content: () => createComponent(),
        },
      ])
    );
  });
});
