import * as commands from '../markdown-commands';

/**
 * Convert a string containing '<sel>' and '</sel>' markers
 * to a commands.EditorState.
 */
function parseState(text) {
  const startMarker = '<sel>';
  const endMarker = '</sel>';

  const selStart = text.indexOf(startMarker);
  const selEnd = text.indexOf(endMarker);

  if (selStart < 0) {
    throw new Error('Input field does not contain a selection start');
  }
  if (selEnd < 0) {
    throw new Error('Input field does not contain a selection end');
  }

  return {
    text: text.replace(/<\/?sel>/g, ''),
    selectionStart: selStart,
    selectionEnd: selEnd - startMarker.length,
  };
}

/**
 * Convert a commands.EditorState to a string containing '<sel>'
 * and '</sel>' markers.
 */
function formatState(state) {
  const selectionStart = state.selectionStart;
  const selectionEnd = state.selectionEnd;
  const text = state.text;
  return (
    text.slice(0, selectionStart) +
    '<sel>' +
    text.slice(selectionStart, selectionEnd) +
    '</sel>' +
    text.slice(selectionEnd)
  );
}

describe('markdown commands', () => {
  describe('span formatting', () => {
    function toggle(state, prefix, suffix, placeholder) {
      prefix = prefix || '**';
      suffix = suffix || '**';
      return commands.toggleSpanStyle(state, prefix, suffix, placeholder);
    }

    it('adds formatting to spans', () => {
      const output = toggle(parseState('make <sel>text</sel> bold'));
      assert.equal(formatState(output), 'make **<sel>text</sel>** bold');
    });

    it('removes formatting from spans', () => {
      const output = toggle(parseState('make **<sel>text</sel>** bold'));
      assert.equal(formatState(output), 'make <sel>text</sel> bold');
    });

    it('adds formatting to spans when the prefix and suffix differ', () => {
      const output = toggle(
        parseState('make <sel>math</sel> mathy'),
        '\\(',
        '\\)'
      );
      assert.equal(formatState(output), 'make \\(<sel>math</sel>\\) mathy');
    });

    it('inserts placeholders if the selection is empty', () => {
      const output = toggle(
        parseState('make <sel></sel> bold'),
        '**',
        undefined,
        'Bold'
      );
      assert.equal(formatState(output), 'make **<sel>Bold</sel>** bold');
    });
  });

  describe('block formatting', () => {
    [
      {
        tag: 'adds formatting to blocks',
        input: 'one\n<sel>two\nthree</sel>\nfour',
        output: 'one\n> <sel>two\n> three</sel>\nfour',
      },
      {
        tag: 'removes formatting from blocks',
        input: 'one \n<sel>> two\n> three</sel>\nfour',
        output: 'one \n<sel>two\nthree</sel>\nfour',
      },
      {
        tag: 'preserves the selection',
        input: 'one <sel>two\nthree </sel>four',
        output: '> one <sel>two\n> three </sel>four',
      },
      {
        tag: 'inserts the block prefix before an empty selection',
        input: '<sel></sel>',
        output: '> <sel></sel>',
      },
    ].forEach(fixture => {
      it(fixture.tag, () => {
        const output = commands.toggleBlockStyle(
          parseState(fixture.input),
          '> '
        );
        assert.equal(formatState(output), fixture.output);
      });
    });
  });

  describe('link formatting', () => {
    const linkify = function (text, linkType) {
      return commands.convertSelectionToLink(parseState(text), linkType);
    };

    [{ selection: 'two' }, { selection: 'jim:smith' }].forEach(testCase => {
      it('converts text to links', () => {
        const sel = testCase.selection;
        const output = linkify('one <sel>' + sel + '</sel> three');
        assert.equal(
          formatState(output),
          'one [' + sel + '](<sel>http://insert-your-link-here.com</sel>) three'
        );
      });
    });

    [
      { selection: 'http://foobar.com' },
      { selection: 'https://twitter.com/username' },
      { selection: ' http://example.com/url-with-a-leading-space' },
    ].forEach(testCase => {
      it(`converts URLs to links`, () => {
        const sel = testCase.selection;
        const output = linkify('one <sel>' + sel + '</sel> three');
        assert.equal(
          formatState(output),
          'one [<sel>Description</sel>](' + sel + ') three'
        );
      });
    });

    it('converts URLs to image links', () => {
      const output = linkify(
        'one <sel>http://foobar.com</sel> three',
        commands.LinkType.IMAGE_LINK
      );
      assert.equal(
        formatState(output),
        'one ![<sel>Description</sel>](http://foobar.com) three'
      );
    });
  });
});
