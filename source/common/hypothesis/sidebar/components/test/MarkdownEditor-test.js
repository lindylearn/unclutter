import { mount } from 'enzyme';
import { render } from 'preact';
import { act } from 'preact/test-utils';

import { LinkType } from '../../markdown-commands';
import MarkdownEditor from '../MarkdownEditor';
import { $imports } from '../MarkdownEditor';

import mockImportedComponents from '../../../test-util/mock-imported-components';
import { checkAccessibility } from '../../../test-util/accessibility';

describe('MarkdownEditor', () => {
  const formatResult = {
    text: 'formatted text',
    selectionStart: 0,
    selectionEnd: 0,
  };
  const fakeMarkdownCommands = {
    convertSelectionToLink: sinon.stub().returns(formatResult),
    toggleBlockStyle: sinon.stub().returns(formatResult),
    toggleSpanStyle: sinon.stub().returns(formatResult),
    LinkType,
  };
  let fakeIsMacOS;
  let MarkdownView;

  beforeEach(() => {
    fakeMarkdownCommands.convertSelectionToLink.resetHistory();
    fakeMarkdownCommands.toggleBlockStyle.resetHistory();
    fakeMarkdownCommands.toggleSpanStyle.resetHistory();
    fakeIsMacOS = sinon.stub().returns(false);

    MarkdownView = function MarkdownView() {
      return null;
    };

    $imports.$mock(mockImportedComponents());
    $imports.$mock({
      '../markdown-commands': fakeMarkdownCommands,
      './MarkdownView': MarkdownView,
      '../../shared/user-agent': {
        isMacOS: fakeIsMacOS,
      },
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  function createComponent(props = {}, mountProps = {}) {
    return mount(
      <MarkdownEditor label="Test editor" text="test" {...props} />,
      mountProps
    );
  }

  const commands = [
    {
      command: 'Bold',
      key: 'b',
      effect: [fakeMarkdownCommands.toggleSpanStyle, '**', '**', 'Bold'],
    },
    {
      command: 'Italic',
      key: 'i',
      effect: [fakeMarkdownCommands.toggleSpanStyle, '*', '*', 'Italic'],
    },
    {
      command: 'Quote',
      key: 'q',
      effect: [fakeMarkdownCommands.toggleBlockStyle, '> '],
    },
    {
      command: 'Insert link',
      key: 'l',
      effect: [fakeMarkdownCommands.convertSelectionToLink],
    },
    {
      command: 'Insert image',
      key: null,
      effect: [
        fakeMarkdownCommands.convertSelectionToLink,
        fakeMarkdownCommands.LinkType.IMAGE_LINK,
      ],
    },
    {
      command: 'Insert math (LaTeX is supported)',
      key: null,
      effect: [
        fakeMarkdownCommands.toggleSpanStyle,
        '$$',
        '$$',
        'Insert LaTeX',
      ],
    },
    {
      command: 'Bulleted list',
      key: 'u',
      effect: [fakeMarkdownCommands.toggleBlockStyle, '* '],
    },
    {
      command: 'Numbered list',
      key: 'o',
      effect: [fakeMarkdownCommands.toggleBlockStyle, '1. '],
    },
  ];
  commands.forEach(({ command, key, effect }) => {
    describe(`"${command}" toolbar command`, () => {
      it('applies formatting when toolbar button is clicked', () => {
        const onEditText = sinon.stub();
        const text = 'toolbar command test';
        const wrapper = createComponent({ text, onEditText });
        const button = wrapper.find(
          `ToolbarButton[title="${command}"] > button`
        );
        const input = wrapper.find('textarea').getDOMNode();
        input.selectionStart = 0;
        input.selectionEnd = text.length;

        button.simulate('click');

        assert.calledWith(onEditText, {
          text: 'formatted text',
        });
        const [formatFunction, ...args] = effect;
        assert.calledWith(
          formatFunction,
          sinon.match({ text, selectionStart: 0, selectionEnd: text.length }),
          ...args
        );
      });

      if (key) {
        describe('renders appropriate tooltip for user OS', () => {
          [
            {
              setOs: () => {
                fakeIsMacOS.returns(true);
              },
              expectedModifier: 'Cmd',
            },
            {
              setOs: () => {
                fakeIsMacOS.returns(false);
              },
              expectedModifier: 'Ctrl',
            },
          ].forEach(test => {
            it('should show the correct modifier key for user OS in button `title`', () => {
              // Test that button `title` shows the correct modifier for user OS:
              // `Cmd-shortcut` for Mac users and `Ctrl-shortcut` for everyone else
              test.setOs();
              const wrapper = createComponent();
              const button = wrapper.find(
                `ToolbarButton[title="${command}"] > button`
              );

              const buttonTitlePattern = new RegExp(
                `${test.expectedModifier}-${key.toUpperCase()}`
              );
              assert.match(button.props().title, buttonTitlePattern);
            });
          });
        });
        // Test that shortcuts are executed with different Ctrl- and Cmd- combos
        const keyEventDetails = [
          { ctrlKey: true, metaKey: false, key },
          { ctrlKey: false, metaKey: true, key },
          { ctrlKey: true, metaKey: true, key },
        ];

        keyEventDetails.forEach(keyEvent => {
          it('applies formatting when shortcut key is pressed', () => {
            const onEditText = sinon.stub();
            const text = 'toolbar shortcut test';
            const wrapper = createComponent({ text, onEditText });
            const input = wrapper.find('textarea');
            input.getDOMNode().selectionStart = 0;
            input.getDOMNode().selectionEnd = text.length;

            input.simulate('keydown', {
              ctrlKey: keyEvent.ctrlKey,
              metaKey: keyEvent.metaKey,
              key: keyEvent.key,
            });

            assert.calledWith(onEditText, {
              text: 'formatted text',
            });
            const [formatFunction, ...args] = effect;
            assert.calledWith(
              formatFunction,
              sinon.match({
                text,
                selectionStart: 0,
                selectionEnd: text.length,
              }),
              ...args
            );
          });
        });
      }
    });
  });

  [
    {
      // Shortcut letter but without ctrl key.
      key: 'b',
      ctrlKey: false,
    },
    {
      // Ctrl key with non-shortcut letter
      key: 'w',
      ctrlKey: true,
    },
  ].forEach(({ ctrlKey, key }) => {
    it('does not apply formatting when a non-shortcut key is pressed', () => {
      const onEditText = sinon.stub();
      const wrapper = createComponent({ onEditText });
      const input = wrapper.find('textarea');

      input.simulate('keydown', {
        ctrlKey,
        key,
      });

      assert.notCalled(onEditText);
    });
  });

  it('calls `onEditText` callback when text is changed', () => {
    const onEditText = sinon.stub();
    const wrapper = createComponent({ onEditText });
    const input = wrapper.find('textarea').getDOMNode();
    input.value = 'changed';
    wrapper.find('textarea').simulate('input');
    assert.calledWith(onEditText, {
      text: 'changed',
    });
  });

  it('enters preview mode when Preview button is clicked', () => {
    const wrapper = createComponent();

    const previewButton = wrapper
      .find('button')
      .filterWhere(el => el.text() === 'Preview');
    previewButton.simulate('click');

    assert.isFalse(wrapper.find('textarea').exists());
    assert.isTrue(wrapper.find('MarkdownView').exists());
    wrapper
      .find('button')
      .filterWhere(el => el.text() !== 'Write')
      .forEach(el => assert.isTrue(el.prop('disabled')));
  });

  it('exits preview mode when Write button is clicked', () => {
    const wrapper = createComponent();

    // Switch to "Preview" mode.
    const previewButton = wrapper
      .find('button')
      .filterWhere(el => el.text() === 'Preview');
    previewButton.simulate('click');

    // Switch back to "Write" mode.
    const writeButton = wrapper
      .find('button')
      .filterWhere(el => el.text() === 'Write');
    writeButton.simulate('click');

    assert.isTrue(wrapper.find('textarea').exists());
    assert.isFalse(wrapper.find('MarkdownView').exists());
    wrapper
      .find('button')
      .filterWhere(el => el.text() !== 'Preview')
      .forEach(el => assert.isFalse(el.prop('disabled')));
  });

  it('focuses the input field when created', () => {
    const container = document.createElement('div');

    try {
      document.body.focus();
      document.body.appendChild(container);
      act(() => {
        render(<MarkdownEditor label="An editor" text="test" />, container);
      });

      assert.equal(document.activeElement.nodeName, 'TEXTAREA');
    } finally {
      container.remove();
    }
  });

  it('sets accessible label for input field', () => {
    const wrapper = createComponent({ label: 'Annotation body' });
    const inputField = wrapper.find('textarea');
    assert.equal(inputField.prop('aria-label'), 'Annotation body');
  });

  describe('keyboard navigation', () => {
    let newContainer;
    let wrapper;

    beforeEach(() => {
      newContainer = document.createElement('div');
      document.body.appendChild(newContainer);
      wrapper = mount(<MarkdownEditor label="Test editor" text="test" />, {
        attachTo: newContainer,
      });
    });

    afterEach(() => {
      newContainer.remove();
    });

    /**
     * Helper method to simulate a keypress on the markdown wrapper
     *
     * @param {string} key - One of 'ArrowRight', 'ArrowLeft', 'End', 'Home'
     */
    const pressKey = key =>
      wrapper.find('.MarkdownEditor__toolbar').simulate('keydown', { key });

    /**
     * Asserts the active button's title partially matches the supplied string.
     *
     * @param {string} partialTitle
     */
    const matchesFocusedTitle = partialTitle => {
      assert.isTrue(
        document.activeElement.getAttribute('title').indexOf(partialTitle) >= 0
      );
    };
    /**
     * Asserts the active button's inner text partially matches the supplied string.
     *
     * @param {string} partialText
     */
    const matchesFocusedText = partialText => {
      assert.isTrue(document.activeElement.innerText.indexOf(partialText) >= 0);
    };

    /**
     * Asserts there should only be one "0" `tabIndex` value at a time which
     * should be set on the focused element. All other `tabIndex` values
     * on elements shall be "-1".
     */
    const testRovingIndex = () => {
      assert.isTrue(document.activeElement.getAttribute('tabIndex') === '0');
      assert.equal(
        wrapper.find('ToolbarButton[tabIndex=0]').length +
          wrapper.find('a[tabIndex=0]').length,
        1
      );
    };

    context('when `isPreviewing` is false', () => {
      it('changes focus circularly to the left', () => {
        pressKey('ArrowLeft');
        // preview is the last button
        matchesFocusedText('Preview');
        testRovingIndex();
      });

      it('changes focus circularly to the right', () => {
        pressKey('ArrowLeft'); // move to the end node
        pressKey('ArrowRight'); // move back to the start
        matchesFocusedTitle('Bold');
        testRovingIndex();
      });

      it('changes focus to the last element when pressing `end`', () => {
        pressKey('End'); // move to the end node
        matchesFocusedText('Preview');
        testRovingIndex();
      });

      it('changes focus to the first element when pressing `home`', () => {
        pressKey('ArrowRight'); // move focus off first button
        pressKey('Home');
        matchesFocusedTitle('Bold');
        testRovingIndex();
      });

      it('preserves the elements order and roving index', () => {
        [
          {
            title: 'Italic',
          },
          {
            title: 'Quote',
          },
          {
            title: 'Insert link',
          },
          {
            title: 'Insert image',
          },
          {
            title: 'Insert math (LaTeX is supported)',
          },
          {
            title: 'Numbered list',
          },
          {
            title: 'Bulleted list',
          },
          {
            title: 'Formatting help',
          },
          {
            text: 'Preview',
          },
          {
            // back to the start
            title: 'Bold',
          },
        ].forEach(test => {
          pressKey('ArrowRight');
          if (test.title) {
            matchesFocusedTitle(test.title);
          }
          if (test.text) {
            matchesFocusedText(test.text);
          }
          testRovingIndex();
        });
      });
    });

    context('when `isPreviewing` is true', () => {
      beforeEach(() => {
        // turn on Preview mode
        act(() => {
          wrapper.find('Toolbar').props().onTogglePreview();
        });
        const previewButton = wrapper
          .find('button')
          .filterWhere(el => el.text() === 'Write');
        previewButton.simulate('focus');
        pressKey('Home');
      });

      it('changes focus to the last element when pressing `end`', () => {
        pressKey('End'); // move to the end node
        matchesFocusedText('Write');
        testRovingIndex();
      });

      it('changes focus to the first element when pressing `home`', () => {
        pressKey('ArrowRight'); // move focus off first button
        pressKey('Home');
        matchesFocusedTitle('Formatting help');
        testRovingIndex();
      });

      it('preserves the elements order', () => {
        [
          {
            text: 'Write',
          },
          {
            title: 'Formatting help',
          },
          {
            // back to the start
            text: 'Write',
          },
        ].forEach(test => {
          // only 2 enabled buttons
          pressKey('ArrowRight');
          if (test.title) {
            matchesFocusedTitle(test.title);
          }
          if (test.text) {
            matchesFocusedText(test.text);
          }
          testRovingIndex();
        });
      });
    });
  });

  it('applies `textStyle` style to <textarea>', () => {
    const textStyle = { fontFamily: 'serif' };
    const wrapper = createComponent({ textStyle });
    assert.deepEqual(wrapper.find('textarea').prop('style'), textStyle);
  });

  it('applies `textStyle` style to preview', () => {
    const textStyle = { fontFamily: 'serif' };
    const wrapper = createComponent({ textStyle });

    act(() => {
      wrapper.find('Toolbar').props().onTogglePreview();
    });
    wrapper.update();

    assert.deepEqual(wrapper.find('MarkdownView').prop('textStyle'), textStyle);
  });

  it(
    'should pass a11y checks',
    checkAccessibility([
      {
        // eslint-disable-next-line react/display-name
        content: () => createComponent(),
      },
      {
        name: 'Preview mode',
        content: () => {
          const wrapper = createComponent();

          const previewButton = wrapper
            .find('button')
            .filterWhere(el => el.text() === 'Preview');
          previewButton.simulate('click');

          return wrapper;
        },
      },
    ])
  );
});
