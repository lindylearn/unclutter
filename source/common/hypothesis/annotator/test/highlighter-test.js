import { render } from 'preact';

import {
  getBoundingClientRect,
  getHighlightsContainingNode,
  highlightRange,
  removeHighlights,
  removeAllHighlights,
  setHighlightsFocused,
  setHighlightsVisible,
} from '../highlighter';

/**
 * Preact component that renders a simplified version of the DOM structure
 * of PDF.js pages.
 *
 * This is used to test PDF-specific highlighting behavior.
 */
function PdfPage({ showPlaceholder = false }) {
  return (
    <div className="page">
      <div className="canvasWrapper">
        {/* Canvas where PDF.js renders the visual PDF output. */}
        <canvas />
      </div>
      {/* Transparent text layer created by PDF.js to enable text selection */}
      {!showPlaceholder && (
        <div className="textLayer">
          {/* Text span created to correspond to some text rendered into the canvas.
            Hypothesis creates `<hypothesis-highlight>` elements here. */}
          <span className="testText">Text to highlight</span>
        </div>
      )}
      {showPlaceholder && (
        <div className="annotator-placeholder testText">
          {/* Placeholder created to anchor annotations to if the text layer has not finished
              rendering. */}
          Loading annotations
        </div>
      )}
    </div>
  );
}

/**
 * Highlight the text in a fake PDF page.
 *
 * @param {HTMLElement} pageContainer - HTML element into which `PdfPage`
 *   component has been rendered
 * @return {HTMLElement} - `<hypothesis-highlight>` element
 */
function highlightPdfRange(pageContainer) {
  const textSpan = pageContainer.querySelector('.testText');
  const range = new Range();
  range.setStartBefore(textSpan.childNodes[0]);
  range.setEndAfter(textSpan.childNodes[0]);
  return highlightRange(range);
}

/**
 * Render a fake PDF.js page (`PdfPage`) and return its container.
 *
 * @return {HTMLElement}
 */
function createPdfPageWithHighlight() {
  const container = document.createElement('div');
  render(<PdfPage />, container);

  highlightPdfRange(container);

  return container;
}

describe('annotator/highlighter', () => {
  describe('highlightRange', () => {
    it('wraps a highlight span around the given range', () => {
      const text = document.createTextNode('test highlight span');
      const el = document.createElement('span');
      el.appendChild(text);
      const range = new Range();
      range.setStartBefore(text);
      range.setEndAfter(text);

      const result = highlightRange(range);

      assert.equal(result.length, 1);
      assert.strictEqual(el.childNodes[0], result[0]);
      assert.equal(result[0].nodeName, 'HYPOTHESIS-HIGHLIGHT');
      assert.isTrue(result[0].classList.contains('hypothesis-highlight'));
    });

    const testText = 'one two three';

    [
      // Range starting at the start of text node and ending in the middle.
      [0, 5],
      // Range starting in the middle of text node and ending in the middle.
      [4, 7],
      // Range starting in the middle of text node and ending at the end.
      [4, testText.length],
      // Empty ranges.
      [0, 0],
      [5, 5],
      [testText.length, testText.length],
    ].forEach(([startPos, endPos]) => {
      it('splits text nodes when only part of one should be highlighted', () => {
        const el = document.createElement('span');
        el.append(testText);

        const range = new Range();
        range.setStart(el.firstChild, startPos);
        range.setEnd(el.firstChild, endPos);
        const result = highlightRange(range);

        const highlightedText = result.reduce(
          (str, el) => str + el.textContent,
          ''
        );
        assert.equal(highlightedText, testText.slice(startPos, endPos));
        assert.equal(el.textContent, testText);
      });
    });

    it('generates correct highlights when the start text node is split', () => {
      const el = document.createElement('span');
      el.append('foo bar baz');

      // nb. It is important for this test case that the start is in the middle
      // of a text node and the end is a point _after_ the text node. eg:
      //
      // ```
      // <div>
      //   some [text
      //   <b>]foo</b>
      // </div>
      // ```
      //
      // (Where the `[` and `]` denote the endpoints of the range)

      const range = new Range();
      range.setStart(el.firstChild, 4);
      range.setEnd(el, 1);
      highlightRange(range, '' /* cssClass */);

      assert.equal(
        el.innerHTML,
        'foo <hypothesis-highlight class="">bar baz</hypothesis-highlight>'
      );
    });

    it('handles a range with no text nodes', () => {
      const el = document.createElement('span');

      const range = new Range();
      range.setStart(el, 0);
      range.setEnd(el, 0);
      const highlights = highlightRange(range);

      assert.deepEqual(highlights, []);
    });

    it('handles a range with no parent element', () => {
      const text = document.createTextNode('foobar');

      const range = new Range();
      range.setStart(text, 0);
      range.setEnd(text, text.data.length);
      const highlights = highlightRange(range);

      assert.deepEqual(highlights, []);
    });

    it('wraps multiple text nodes which are not adjacent', () => {
      const strings = ['hello', ' Brave ', ' New ', ' World'];
      const textNodes = strings.map(s => document.createTextNode(s));

      const el = document.createElement('span');
      textNodes.forEach(n => {
        const childEl = document.createElement('span');
        childEl.append(n);
        el.append(childEl);
      });

      const range = new Range();
      range.setStartBefore(textNodes[0]);
      range.setEndAfter(textNodes[textNodes.length - 1]);
      const result = highlightRange(range);

      assert.equal(result.length, textNodes.length);
      result.forEach((highlight, i) => {
        assert.equal(highlight.nodeName, 'HYPOTHESIS-HIGHLIGHT');
        assert.deepEqual(Array.from(highlight.childNodes), [textNodes[i]]);
      });
    });

    it('wraps multiple text nodes which are adjacent', () => {
      const strings = ['hello', ' Brave ', ' New ', ' World'];
      const textNodes = strings.map(s => document.createTextNode(s));

      const el = document.createElement('span');
      textNodes.forEach(n => el.append(n));

      const range = new Range();
      range.setStartBefore(textNodes[0]);
      range.setEndAfter(textNodes[textNodes.length - 1]);
      const result = highlightRange(range);

      assert.equal(result.length, 1);
      assert.equal(el.childNodes.length, 1);
      assert.equal(el.childNodes[0], result[0]);
      assert.equal(result[0].textContent, strings.join(''));
    });

    it('wraps a span of text nodes which include space-only nodes', () => {
      const txt = document.createTextNode('one');
      const blank = document.createTextNode(' ');
      const txt2 = document.createTextNode('two');
      const el = document.createElement('span');
      el.appendChild(txt);
      el.appendChild(blank);
      el.appendChild(txt2);

      const range = new Range();
      range.setStartBefore(txt);
      range.setEndAfter(txt2);
      const result = highlightRange(range);

      assert.equal(result.length, 1);
      assert.equal(result[0].textContent, 'one two');
    });

    it('skips text node spans which consist only of spaces', () => {
      const el = document.createElement('span');
      el.appendChild(document.createTextNode(' '));
      el.appendChild(document.createTextNode(''));
      el.appendChild(document.createTextNode('   '));
      const range = new Range();
      range.setStartBefore(el.childNodes[0]);
      range.setEndAfter(el.childNodes[2]);

      const result = highlightRange(range);

      assert.equal(result.length, 0);
    });

    context('when the highlighted text is part of a PDF.js text layer', () => {
      it("removes the highlight element's background color", () => {
        const page = createPdfPageWithHighlight();
        const highlight = page.querySelector('hypothesis-highlight');
        assert.isTrue(highlight.classList.contains('is-transparent'));
      });

      it('creates an SVG layer above the PDF canvas and draws a highlight in that', () => {
        const page = createPdfPageWithHighlight();
        const canvas = page.querySelector('canvas');
        const svgLayer = page.querySelector('svg');

        // Verify SVG layer was created.
        assert.ok(svgLayer);
        assert.equal(svgLayer.previousElementSibling, canvas);

        // Check that an SVG graphic element was created for the highlight.
        const highlight = page.querySelector('hypothesis-highlight');
        const svgRect = page.querySelector('rect');
        assert.ok(svgRect);
        assert.equal(highlight.svgHighlight, svgRect);
      });

      it('re-uses the existing SVG layer for the page if present', () => {
        // Create a PDF page with a single highlight.
        const page = createPdfPageWithHighlight();

        // Create a second highlight on the same page.
        highlightPdfRange(page);

        // There should be multiple highlights.
        assert.equal(page.querySelectorAll('hypothesis-highlight').length, 2);

        // ... but only one SVG layer.
        assert.equal(page.querySelectorAll('svg').length, 1);
        // ... with multiple <rect>s
        assert.equal(
          page.querySelector('svg').querySelectorAll('rect').length,
          2
        );
      });

      it('does not create an SVG highlight if the canvas is not found', () => {
        const container = document.createElement('div');
        render(<PdfPage />, container);

        // Remove canvas. This might be missing if the DOM structure looks like
        // PDF.js but isn't, or perhaps a future PDF.js update or fork changes
        // the DOM structure significantly. In that case, we'll fall back to
        // regular CSS-based highlighting.
        container.querySelector('canvas').remove();

        const [highlight] = highlightPdfRange(container);

        assert.isFalse(highlight.classList.contains('is-transparent'));
        assert.isNull(container.querySelector('rect'));
        assert.notOk(highlight.svgHighlight);
      });

      it('does not create an SVG highlight for placeholder highlights', () => {
        const container = document.createElement('div');
        render(<PdfPage showPlaceholder={true} />, container);
        const [highlight] = highlightPdfRange(container);

        // If the highlight is a placeholder, the highlight element should still
        // be created.
        assert.ok(highlight);
        assert.equal(highlight.textContent, 'Loading annotations');

        // ...but the highlight should be visually hidden so the SVG should
        // not be created.
        assert.isNull(container.querySelector('rect'));
      });

      describe('CSS blend mode support testing', () => {
        beforeEach(() => {
          sinon.stub(CSS, 'supports');
        });

        afterEach(() => {
          CSS.supports.restore();
        });

        it('renders highlights when mix-blend-mode is supported', () => {
          const container = document.createElement('div');
          render(<PdfPage />, container);
          CSS.supports.withArgs('mix-blend-mode', 'multiply').returns(true);

          highlightPdfRange(container);

          // When mix blending is available, the highlight layer has default
          // opacity and highlight rects are transparent.
          const highlightLayer = container.querySelector(
            '.hypothesis-highlight-layer'
          );
          assert.equal(highlightLayer.style.opacity, '');
          const rect = container.querySelector('rect');
          assert.equal(rect.getAttribute('class'), 'hypothesis-svg-highlight');
        });

        it('renders highlights when mix-blend-mode is not supported', () => {
          const container = document.createElement('div');
          render(<PdfPage />, container);
          CSS.supports.withArgs('mix-blend-mode', 'multiply').returns(false);

          highlightPdfRange(container);

          // When mix blending is not available, highlight rects are opaque and
          // the entire highlight layer is transparent.
          const highlightLayer = container.querySelector(
            '.hypothesis-highlight-layer'
          );
          assert.equal(highlightLayer.style.opacity, '0.3');
          const rect = container.querySelector('rect');
          assert.include(
            rect.getAttribute('class'),
            'hypothesis-svg-highlight is-opaque'
          );
        });
      });
    });
  });

  describe('removeHighlights', () => {
    it('unwraps all the elements', () => {
      const txt = document.createTextNode('word');
      const el = document.createElement('span');
      const hl = document.createElement('span');
      const div = document.createElement('div');
      el.appendChild(txt);
      hl.appendChild(el);
      div.appendChild(hl);

      removeHighlights([hl]);

      assert.isNull(hl.parentNode);
      assert.strictEqual(el.parentNode, div);
    });

    it('does not fail on nodes with no parent', () => {
      const txt = document.createTextNode('no parent');
      const hl = document.createElement('span');
      hl.appendChild(txt);

      removeHighlights([hl]);
    });

    it('removes any associated SVG elements external to the highlight element', () => {
      const page = createPdfPageWithHighlight();
      const highlight = page.querySelector('hypothesis-highlight');

      assert.instanceOf(highlight.svgHighlight, SVGElement);
      assert.equal(page.querySelectorAll('rect').length, 1);

      removeHighlights([highlight]);

      assert.equal(page.querySelectorAll('rect').length, 0);
    });
  });

  /**
   * Add some text nodes to `root` and highlight them with `highlightRange`.
   *
   * Returns all the highlight elements.
   */
  function createHighlights(root) {
    let highlights = [];

    for (let i = 0; i < 3; i++) {
      const span = document.createElement('span');
      span.textContent = 'Test text';
      const range = new Range();
      range.setStartBefore(span.childNodes[0]);
      range.setEndAfter(span.childNodes[0]);
      root.appendChild(span);
      highlights.push(...highlightRange(range));
    }

    return highlights;
  }

  describe('removeAllHighlights', () => {
    it('removes all highlight elements under the root element', () => {
      const root = document.createElement('div');

      createHighlights(root);

      const textContent = root.textContent;
      assert.equal(root.querySelectorAll('hypothesis-highlight').length, 3);

      removeAllHighlights(root);

      assert.equal(root.querySelectorAll('hypothesis-highlight').length, 0);
      assert.equal(root.textContent, textContent);
    });

    it('does nothing if there are no highlights', () => {
      const root = document.createElement('div');
      root.innerHTML = '<span>one</span>-<span>two</span>-<span>three</span>';

      removeAllHighlights(root);

      assert.equal(root.textContent, 'one-two-three');
    });
  });

  describe('setHighlightsFocused', () => {
    it('adds class to HTML highlights when focused', () => {
      const root = document.createElement('div');
      const highlights = createHighlights(root);

      setHighlightsFocused(highlights, true);

      highlights.forEach(h =>
        assert.isTrue(h.classList.contains('hypothesis-highlight-focused'))
      );
    });

    it('removes class from HTML highlights when not focused', () => {
      const root = document.createElement('div');
      const highlights = createHighlights(root);

      setHighlightsFocused(highlights, true);
      setHighlightsFocused(highlights, false);

      highlights.forEach(h =>
        assert.isFalse(h.classList.contains('hypothesis-highlight-focused'))
      );
    });

    it('adds class to PDF highlights when focused', () => {
      const root = document.createElement('div');
      render(<PdfPage />, root);
      const highlights = highlightPdfRange(root);

      setHighlightsFocused(highlights, true);

      highlights.forEach(h =>
        assert.isTrue(h.svgHighlight.classList.contains('is-focused'))
      );
    });

    it('raises focused highlights in PDFs', () => {
      const root = document.createElement('div');
      render(<PdfPage />, root);
      const highlights1 = highlightPdfRange(root);
      const highlights2 = highlightPdfRange(root);
      const svgLayer = root.querySelector('svg');

      const lastSVGHighlight = highlights =>
        highlights[highlights.length - 1].svgHighlight;

      setHighlightsFocused(highlights1, true);
      assert.equal(svgLayer.lastChild, lastSVGHighlight(highlights1));

      setHighlightsFocused(highlights2, true);
      assert.equal(svgLayer.lastChild, lastSVGHighlight(highlights2));
    });

    it('removes class from PDF highlights when not focused', () => {
      const root = document.createElement('div');
      render(<PdfPage />, root);
      const highlights = highlightPdfRange(root);

      setHighlightsFocused(highlights, true);
      setHighlightsFocused(highlights, false);

      highlights.forEach(h =>
        assert.isFalse(h.svgHighlight.classList.contains('is-focused'))
      );
    });
  });

  describe('setHighlightsVisible', () => {
    it('adds class to root when `visible` is `true`', () => {
      const root = document.createElement('div');
      setHighlightsVisible(root, true);
      assert.isTrue(root.classList.contains('hypothesis-highlights-always-on'));
    });

    it('removes class from root when `visible` is `false`', () => {
      const root = document.createElement('div');

      setHighlightsVisible(root, true);
      setHighlightsVisible(root, false);

      assert.isFalse(
        root.classList.contains('hypothesis-highlights-always-on')
      );
    });
  });

  describe('getHighlightsContainingNode', () => {
    const makeRange = (start, end = start) => {
      const range = new Range();
      range.setStartBefore(start);
      range.setEndAfter(end);
      return range;
    };

    it('returns all the highlights containing the node', () => {
      const root = document.createElement('div');
      const text0 = document.createTextNode('One');
      const text1 = document.createTextNode('Two');
      root.appendChild(text0);
      root.appendChild(text1);

      const [highlight0] = highlightRange(makeRange(text0, text1));
      const [highlight1] = highlightRange(makeRange(text0));

      const highlights = getHighlightsContainingNode(text0);

      assert.deepEqual(highlights, [highlight1, highlight0]);
    });

    it('returns an empty array if the node is not contained in a highlight', () => {
      const root = document.createElement('div');
      root.textContent = 'Test text';
      assert.deepEqual(getHighlightsContainingNode(root.childNodes[0]), []);
    });

    it('returns an empty array if node has no parent element', () => {
      const text = document.createTextNode('foobar');
      assert.deepEqual(getHighlightsContainingNode(text), []);
    });
  });

  describe('getBoundingClientRect', () => {
    it('returns the bounding box of all the highlight client rectangles', () => {
      const rects = [
        {
          top: 20,
          left: 15,
          bottom: 30,
          right: 25,
        },
        {
          top: 10,
          left: 15,
          bottom: 20,
          right: 25,
        },
        {
          top: 15,
          left: 20,
          bottom: 25,
          right: 30,
        },
        {
          top: 15,
          left: 10,
          bottom: 25,
          right: 20,
        },
      ];
      const fakeHighlights = rects.map(r => {
        return { getBoundingClientRect: () => r };
      });

      const result = getBoundingClientRect(fakeHighlights);

      assert.equal(result.left, 10);
      assert.equal(result.top, 10);
      assert.equal(result.right, 30);
      assert.equal(result.bottom, 30);
    });
  });
});
