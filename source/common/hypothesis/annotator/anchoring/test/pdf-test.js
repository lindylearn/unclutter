import * as pdfAnchoring from '../pdf';
import { matchQuote } from '../match-quote';
import { TextRange } from '../text-range';

import FakePDFViewerApplication from './fake-pdf-viewer-application';

/**
 * Return a DOM Range which refers to the specified `text` in `container`.
 *
 * @param {Element} container
 * @param {string} text
 * @return {Range}
 */
function findText(container, text) {
  const pos = container.textContent.indexOf(text);
  if (pos < 0) {
    throw new Error('Text not found');
  }
  return TextRange.fromOffsets(container, pos, pos + text.length).toRange();
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const fixtures = {
  // Each item in this list contains the text for one page of the "PDF".
  //
  // Each line within an item is converted to a single text item, as returned by
  // PDF.js' text APIs, and rendered as a separate element in the text layer.
  pdfPages: [
    'Pride And Prejudice And Zombies\n' +
      '       \n' + // nb. Blank text item handling differs between PDF.js versions
      'By Jane Austen and Seth Grahame-Smith ',

    'IT IS A TRUTH universally acknowledged that a zombie in possession of\n' +
      'brains must be in want of more brains. Never was this truth more plain\n' +
      'than during the recent attacks at Netherfield Park, in which a household\n' +
      'of eighteen was slaughtered and consumed by a horde of the living dead.',

    '"My dear Mr. Bennet," said his lady to him one day, "have you heard that\n' +
      'Netherfield Park is occupied again?" ',

    'NODE A\nNODE B\nNODE C',
  ],
};

describe('annotator/anchoring/pdf', () => {
  let container;
  let viewer;

  /**
   * Initialize the fake PDF.js viewer.
   *
   * @param {string[]} content -
   *   Array containing the text content of each page of the loaded PDF document
   * @param {import('./fake-pdf-viewer-application').PDFJSConfig} [config]
   */
  function initViewer(content, config) {
    cleanupViewer();

    // The rendered text for each page is cached during anchoring.
    // Clear this here so that each test starts from the same state.
    pdfAnchoring.purgeCache();

    viewer = new FakePDFViewerApplication({
      container,
      content,
      config,
    });
    window.PDFViewerApplication = viewer;

    if (viewer.pdfViewer.pagesCount > 0) {
      viewer.pdfViewer.setCurrentPage(0);
    }
  }

  /** Clean up any resources created by the fake PDF.js viewer. */
  function cleanupViewer() {
    viewer?.dispose();
    window.PDFViewerApplication = null;
  }

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    initViewer(fixtures.pdfPages);
  });

  afterEach(() => {
    pdfAnchoring.$imports.$restore();
    cleanupViewer();
    container.remove();
  });

  describe('#describe', () => {
    it('returns position and quote selectors', () => {
      viewer.pdfViewer.setCurrentPage(2);
      const range = findText(container, 'Netherfield Park');
      return pdfAnchoring.describe(container, range).then(selectors => {
        const types = selectors.map(s => {
          return s.type;
        });
        assert.deepEqual(types, ['TextPositionSelector', 'TextQuoteSelector']);
      });
    });

    it('returns a position selector with correct start/end offsets', async () => {
      viewer.pdfViewer.setCurrentPage(2);
      const quote = 'Netherfield Park';
      const range = findText(container, quote);
      const contentStr = fixtures.pdfPages.join('');
      const expectedPos = contentStr.replace(/\n/g, '').lastIndexOf(quote);

      const [positionSelector] = await pdfAnchoring.describe(container, range);

      assert.equal(positionSelector.start, expectedPos);
      assert.equal(positionSelector.end, expectedPos + quote.length);
    });

    // This test is similar to the above, but simulates older PDF.js releases
    // which do not create elements in the text layer for whitespace-only text items.
    it('returns a position selector with correct start/end offsets (old text rendering)', async () => {
      initViewer(fixtures.pdfPages, { newTextRendering: false });

      viewer.pdfViewer.setCurrentPage(2);
      const quote = 'Netherfield Park';
      const range = findText(container, quote);
      const contentStr = fixtures.pdfPages
        .map(pageText =>
          pageText
            .split('\n')
            .filter(line => !line.match(/^\s*$/)) // Strip whitespace-only text items
            .join('\n')
        )
        .join('');
      const expectedPos = contentStr.replace(/\n/g, '').lastIndexOf(quote);

      const [positionSelector] = await pdfAnchoring.describe(container, range);

      assert.equal(positionSelector.start, expectedPos);
      assert.equal(positionSelector.end, expectedPos + quote.length);
    });

    it('returns a quote selector with the correct quote', () => {
      viewer.pdfViewer.setCurrentPage(2);
      const range = findText(container, 'Netherfield Park');
      return pdfAnchoring.describe(container, range).then(selectors => {
        const quote = selectors[1];

        assert.deepEqual(quote, {
          type: 'TextQuoteSelector',
          exact: 'Netherfield Park',
          prefix: 'im one day, "have you heard that',
          suffix: ' is occupied again?" ',
        });
      });
    });

    it('returns selector when range starts at end of text node with no next siblings', () => {
      // this problem is referenced in client issue #122
      // But what is happening is the startContainer is referencing a text
      // elment inside of a node. The logic in pdf#describe() was assuming if the
      // selection was not middle of the word, the text node would have a nextSibling.
      // However, if the selection is at the end of the only text node of its
      // parent set, this fails.

      viewer.pdfViewer.setCurrentPage(3);

      const quote = 'NODE B';

      // this selects NODE A text node
      const textNodeSelected =
        container.querySelector('.textLayer div').firstChild;
      const staticRange = findText(container, quote);

      const range = {
        // put the selection at the very end of the node
        startOffset: textNodeSelected.length,
        startContainer: textNodeSelected,
        endOffset: staticRange.endOffset,
        endContainer: staticRange.endContainer,
        commonAncestorContainer: staticRange.commonAncestorContainer,
      };

      const contentStr = fixtures.pdfPages.join('');
      const expectedPos = contentStr.replace(/\n/g, '').lastIndexOf(quote);

      return pdfAnchoring.describe(container, range).then(selectors => {
        const position = selectors[0];
        assert.equal(position.start, expectedPos);
        assert.equal(position.end, expectedPos + quote.length);
      });
    });

    it('throws if range spans multiple pages', async () => {
      viewer.pdfViewer.setCurrentPage(2, 3);
      const firstPageRange = findText(container, 'occupied again?');
      const secondPageRange = findText(container, 'NODE A');
      const range = new Range();
      range.setStart(firstPageRange.startContainer, firstPageRange.startOffset);
      range.setEnd(secondPageRange.startContainer, secondPageRange.endOffset);

      await assert.rejects(
        pdfAnchoring.describe(container, range),
        'Selecting across page breaks is not supported'
      );
    });

    it('throws if range is outside the text layer', async () => {
      viewer.pdfViewer.setCurrentPage(2, 3);

      const range = new Range();
      const el = document.createElement('div');
      el.append('foobar');
      range.setStart(el.firstChild, 0);
      range.setEnd(el.firstChild, 6);

      await assert.rejects(
        pdfAnchoring.describe(container, range),
        'Selection is outside page text'
      );
    });

    it('throws if range does not contain any text nodes', async () => {
      viewer.pdfViewer.setCurrentPage(2, 3);

      const range = new Range();
      const el = document.createElement('div');
      range.setStart(el, 0);
      range.setEnd(el, 0);

      await assert.rejects(
        pdfAnchoring.describe(container, range),
        'Selection does not contain text'
      );
    });
  });

  describe('#anchor', () => {
    it('anchors previously created selectors if the page is rendered', () => {
      viewer.pdfViewer.setCurrentPage(2);
      const range = findText(container, 'My dear Mr. Bennet');
      return pdfAnchoring.describe(container, range).then(selectors => {
        const position = selectors[0];
        const quote = selectors[1];

        // Test that all of the selectors anchor and that each selector individually
        // anchors correctly as well
        const subsets = [[position, quote], [quote]];
        const subsetsAnchored = subsets.map(subset => {
          const types = subset.map(s => {
            return s.type;
          });
          const description = 'anchoring failed with ' + types.join(', ');

          return pdfAnchoring
            .anchor(container, subset)
            .then(anchoredRange => {
              assert.equal(
                anchoredRange.toString(),
                range.toString(),
                description
              );
            })
            .catch(err => {
              console.warn(description);
              throw err;
            });
        });
        return Promise.all(subsetsAnchored);
      });
    });

    [[], [{ type: 'TextPositionSelector', start: 0, end: 200 }]].forEach(
      selectors => {
        it('fails to anchor if there is no quote selector', async () => {
          let error;
          try {
            await pdfAnchoring.anchor(container, selectors);
          } catch (err) {
            error = err;
          }
          assert.instanceOf(error, Error);
          assert.equal(error.message, 'No quote selector found');
        });
      }
    );

    it('anchors text in older PDF.js versions', async () => {
      initViewer(fixtures.pdfPages, { newTextRendering: false });

      // Choose a quote in the first page, which has blank text items in it.
      const quote = { type: 'TextQuoteSelector', exact: 'Jane Austen' };
      const range = await pdfAnchoring.anchor(container, [quote]);

      assert.equal(range.toString(), 'Jane Austen');
    });

    // See https://github.com/hypothesis/client/issues/3705
    [
      // Exact match for text in PDF.
      'Netherfield Park is',

      // Exact match for text in PDF when whitespace differences are ignored.
      'Netherfield  Park  is',
      'NetherfieldParkis',

      // Close match for text in PDF.
      'Netherfield Park as',
    ].forEach(quoteText => {
      it('anchors quotes to best match across all pages', async () => {
        viewer.pdfViewer.setCurrentPage(2);
        const quote = { type: 'TextQuoteSelector', exact: quoteText };
        const range = await pdfAnchoring.anchor(container, [quote]);

        // This should anchor to an exact match on the third page, rather than a
        // close match on the second page.
        assert.equal(range.toString(), 'Netherfield Park is');
      });
    });

    [
      {
        // If there is only a prefix, that should match.
        test: 'prefix-only',
        prefix: 'that',
        suffix: undefined,
        expectedMatch: 'Netherfield Park is occupied again?',
      },
      {
        // If there is only a suffix, that should match.
        test: 'suffix-only',
        prefix: undefined,
        suffix: ' Park is occupied',
        expectedMatch: 'Netherfield Park is occupied again?',
      },
      {
        // If there is both a prefix and suffix, either can match
        test: 'suffix-match',
        prefix: 'DOES NOT MATCH',
        suffix: ' Park is occupied',
        expectedMatch: 'Netherfield Park is occupied again?',
      },
      {
        // If there is both a prefix and suffix, either can match
        test: 'prefix-match',
        prefix: 'that',
        suffix: 'DOES NOT MATCH',
        expectedMatch: 'Netherfield Park is occupied again?',
      },
      {
        // If there is neither a prefix or suffix, only the quote matters.
        test: 'no-context',
        prefix: undefined,
        suffix: undefined,
        expectedMatch: 'recent attacks at Netherfield Park',
      },
    ].forEach(({ test, prefix, suffix, expectedMatch }) => {
      it(`prefers a context match for quote selectors (${test})`, async () => {
        const expectedPage = fixtures.pdfPages.findIndex(page =>
          page.includes(expectedMatch)
        );
        assert.notEqual(expectedPage, -1);

        // Ensure the page where we expect to find the match is rendered, otherwise
        // the quote will be anchored to a placeholder.
        viewer.pdfViewer.setCurrentPage(expectedPage);

        // Create a quote selector where the `exact` phrase occurs on multiple
        // pages.
        const quote = {
          type: 'TextQuoteSelector',
          exact: 'Netherfield',
          prefix,
          suffix,
        };

        // Anchor the quote without providing a position selector, so pages are tried in order.
        const range = await pdfAnchoring.anchor(container, [quote]);

        // Check that we found the match on the expected page.
        assert.equal(range.toString(), 'Netherfield');
        assert.include(
          range.startContainer.parentElement.textContent,
          expectedMatch
        );
      });
    });

    // The above test does high-level checking that whitespace mismatches don't
    // affect quote anchoring. This test checks calls to `matchQuote` in more detail.
    it('ignores spaces when searching for quote matches', async () => {
      const matchQuoteSpy = sinon.spy(matchQuote);
      pdfAnchoring.$imports.$mock({
        './match-quote': { matchQuote: matchQuoteSpy },
      });

      viewer.pdfViewer.setCurrentPage(2);

      // nb. The new lines in fixtures don't appear in the extracted PDF text.
      const getPageText = page => fixtures.pdfPages[page].replaceAll('\n', '');

      const quote = {
        type: 'TextQuoteSelector',
        exact: 'Mr. Bennet',
        prefix: 'My dear',
        suffix: '," said his lady',
      };
      const quoteOffset =
        getPageText(0).length +
        getPageText(1).length +
        getPageText(2).indexOf(quote.exact);

      const position = {
        type: 'TextPositionSelector',
        start: quoteOffset,

        // Intentionally incorrect end position to trigger fallback to quote anchoring.
        end: quoteOffset + 1,
      };

      await pdfAnchoring.anchor(container, [position, quote]);

      const stripSpaces = str => str.replace(/\s+/g, '');
      const strippedText = stripSpaces(fixtures.pdfPages[2]);
      const strippedQuote = stripSpaces(quote.exact);

      const call = matchQuoteSpy
        .getCalls()
        .find(call => call.args[0] === strippedText);
      assert.ok(call);
      assert.equal(call.args[1], strippedQuote);
      assert.match(call.args[2], {
        prefix: stripSpaces(quote.prefix),
        suffix: stripSpaces(quote.suffix),
        hint: strippedText.indexOf(strippedQuote),
      });
    });

    // See https://github.com/hypothesis/client/issues/1329
    it('anchors selectors that match the last text on the page', async () => {
      viewer.pdfViewer.setCurrentPage(1);
      const selectors = [
        {
          type: 'TextQuoteSelector',
          exact: 'horde of the living dead.',
        },
      ];
      const anchoredRange = await pdfAnchoring.anchor(container, selectors);
      assert.equal(anchoredRange.toString(), selectors[0].exact);
    });

    [
      {
        // Position on page before quote.
        offset: 5,
      },
      {
        // Position same page as quote, but different location.
        offset: fixtures.pdfPages[0].length + 1,
      },
      {
        // Position on a page after the quote.
        offset: fixtures.pdfPages[0].length + fixtures.pdfPages[1].length + 5,
      },
      {
        // Position before beginning of document.
        offset: -500,
      },
      {
        // Position beyond end of document.
        offset: 100000,
      },
    ].forEach(({ offset }) => {
      it('anchors using a quote if the position selector fails', () => {
        viewer.pdfViewer.setCurrentPage(1);
        const selection = 'zombie in possession';
        const range = findText(container, selection);
        return pdfAnchoring
          .describe(container, range)
          .then(([, quote]) => {
            const position = {
              type: 'TextPositionSelector',
              start: offset,
              end: offset + selection.length,
            };
            return pdfAnchoring.anchor(container, [position, quote]);
          })
          .then(range => {
            assert.equal(range.toString(), selection);
          });
      });
    });

    it('anchors to a placeholder element if the page is not rendered', () => {
      viewer.pdfViewer.setCurrentPage(2);
      const range = findText(container, 'Netherfield Park');
      return pdfAnchoring
        .describe(container, range)
        .then(selectors => {
          viewer.pdfViewer.setCurrentPage(0);
          return pdfAnchoring.anchor(container, selectors);
        })
        .then(anchoredRange => {
          assert.equal(anchoredRange.toString(), 'Loading annotations...');
        });
    });

    it('rejects if quote cannot be anchored', () => {
      viewer.pdfViewer.setCurrentPage(2);
      const selectors = [
        {
          type: 'TextQuoteSelector',
          exact: 'phrase that does not exist in the PDF',
        },
      ];
      return pdfAnchoring.anchor(container, selectors).catch(err => {
        assert.equal(err.message, 'Quote not found');
      });
    });

    it('re-anchors successfully using caches', () => {
      viewer.pdfViewer.setCurrentPage(2);
      const range = findText(container, 'said his lady');
      let selectors;
      return pdfAnchoring
        .describe(container, range)
        .then(selectors_ => {
          selectors = selectors_;

          // Adjust the position selector so that anchoring fails, and a fallback
          // to the quote selector is required.
          const position = selectors.find(
            s => s.type === 'TextPositionSelector'
          );
          position.start += 100;
          position.end += 100;

          return pdfAnchoring.anchor(container, selectors);
        })
        .then(() => {
          // Anchor again using the same selectors. This time anchoring will
          // use the existing cache.
          return pdfAnchoring.anchor(container, selectors);
        })
        .then(range => {
          assert.equal(range.toString(), 'said his lady');
        });
    });

    [
      {
        // `PDFViewer.getPageView` returns a nullish value.
        description: 'page view not loaded',
        pageView: undefined,
        eventDispatch: 'eventBus',
      },
      {
        // `PDFPageViewer.getPageView` returns a `PDFPageView`, but the associated
        // page is not ready yet and so the `pdfPage` property is missing.
        description: 'page view PDF page not ready',
        pageView: {},
        eventDispatch: 'eventBus',
      },
      {
        // Older version of PDF.js (< 1.6.210) using DOM events.
        description: 'old PDF.js version',
        pageView: undefined,
        eventDispatch: 'dom',
      },
    ].forEach(({ description, pageView, eventDispatch }) => {
      it(`waits until page views are ready (${description})`, async () => {
        if (eventDispatch === 'dom') {
          // To simulate versions of PDF.js < 1.6.210, remove the `eventBus` API.
          delete viewer.pdfViewer.eventBus;
        }

        viewer.pdfViewer.setCurrentPage(1);

        // Simulate PDF viewer not having fully loaded yet.
        const getPageView = sinon.stub(viewer.pdfViewer, 'getPageView');
        getPageView.returns(pageView);

        // Try anchoring. The PDF anchoring logic should wait until the PDF
        // page view is ready.
        const anchorPromise = pdfAnchoring.anchor(container, [
          {
            type: 'TextQuoteSelector',
            exact: 'a zombie in possession',
          },
        ]);

        // Wait a moment so that anchoring will attempt to fetch the PDF page
        // view, but block because it is not ready yet.
        await delay(10);
        getPageView.restore();
        viewer.pdfViewer.notify('pagesloaded', { eventDispatch });

        // Check that anchoring completes successfully when the document has
        // loaded.
        const anchor = await anchorPromise;
        assert.equal(anchor.toString(), 'a zombie in possession');
      });
    });
  });

  describe('documentHasText', () => {
    it('returns true if PDF has selectable text', async () => {
      assert.isTrue(await pdfAnchoring.documentHasText());
    });

    [
      // Completely empty document.
      [],
      // Single page with no text.
      [''],
      // Multiple pages with no text.
      ['', '', ''],
    ].forEach(content => {
      it('returns false if PDF does not have selectable text', async () => {
        initViewer(content);
        assert.isFalse(await pdfAnchoring.documentHasText());
      });
    });
  });
});
