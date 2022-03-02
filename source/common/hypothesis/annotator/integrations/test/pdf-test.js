import { PDFIntegration, $imports } from '../pdf';

import FakePDFViewerApplication from '../../anchoring/test/fake-pdf-viewer-application';
import { RenderingStates } from '../../anchoring/pdf';
import { createPlaceholder } from '../../anchoring/placeholder';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function awaitEvent(target, eventName) {
  return new Promise(resolve => {
    target.addEventListener(eventName, event => resolve(event), {
      once: true,
    });
  });
}

describe('PDFIntegration', () => {
  // Fake for the top-level `#outerContainer` DOM element created by PDF.js.
  let outerContainer;
  // Fake for the `#viewerContainer` DOM element created by PDF.js that contains
  // the actual PDF content.
  let viewerContainer;

  let fakeAnnotator;
  let fakePDFAnchoring;
  let fakePDFMetadata;
  let fakePDFViewerApplication;
  let fakeScrollUtils;
  let pdfIntegration;

  function createPDFIntegration(options = {}) {
    return new PDFIntegration(fakeAnnotator, options);
  }

  beforeEach(() => {
    // Setup fake PDF.js viewer.
    outerContainer = document.createElement('div');
    outerContainer.id = 'outerContainer';
    document.body.appendChild(outerContainer);

    viewerContainer = document.createElement('div');
    outerContainer.appendChild(viewerContainer);

    fakePDFViewerApplication = new FakePDFViewerApplication({
      container: viewerContainer,
      content: ['First page', 'Second page'],
    });
    fakePDFViewerApplication.pdfViewer.setCurrentPage(0);
    window.PDFViewerApplication = fakePDFViewerApplication;

    fakeAnnotator = {
      anchor: sinon.stub(),
      anchors: [],
      anchoring: null,
    };

    fakePDFAnchoring = {
      RenderingStates,
      anchor: sinon.stub(),
      describe: sinon.stub(),
      documentHasText: sinon.stub().resolves(true),
    };

    fakePDFMetadata = {
      getMetadata: sinon
        .stub()
        .resolves({ title: 'Dummy PDF', documentFingerprint: 'abc' }),
      getUri: sinon.stub().resolves('https://example.com/test.pdf'),
    };

    fakeScrollUtils = {
      offsetRelativeTo: sinon.stub().returns(0),
      scrollElement: sinon.stub().resolves(),
    };

    $imports.$mock({
      './pdf-metadata': { PDFMetadata: sinon.stub().returns(fakePDFMetadata) },
      '../anchoring/pdf': fakePDFAnchoring,
      '../util/scroll': fakeScrollUtils,

      // Disable debouncing of updates.
      'lodash.debounce': callback => callback,
    });
  });

  afterEach(() => {
    pdfIntegration?.destroy();
    delete window.PDFViewerApplication;
    outerContainer.remove();
    $imports.$restore();
  });

  function pdfViewerHasClass(className) {
    return fakePDFViewerApplication.pdfViewer.viewer.classList.contains(
      className
    );
  }

  describe('#constructor', () => {
    it('adds CSS classes to override PDF.js styles', () => {
      pdfIntegration = createPDFIntegration();
      assert.isTrue(pdfViewerHasClass('has-transparent-text-layer'));
    });
  });

  it('hides annotation layers when there is a text selection', async () => {
    // This tests checks for a CSS class on the root PDF viewer element.
    // The annotation layers are hidden by a CSS rule that uses this class.

    // Start with an empty selection.
    const selection = window.getSelection();
    if (!selection.isCollapsed) {
      selection.collapseToStart();
    }
    pdfIntegration = createPDFIntegration();
    assert.isFalse(pdfViewerHasClass('is-selecting'));

    // Make the selection non-empty.
    selection.selectAllChildren(document.body);
    await awaitEvent(document, 'selectionchange');
    assert.isTrue(pdfViewerHasClass('is-selecting'));

    // Then make the selection empty again.
    selection.collapseToStart();
    await awaitEvent(document, 'selectionchange');
    assert.isFalse(pdfViewerHasClass('is-selecting'));

    // Finally, remove the selection entirely.
    selection.removeAllRanges();
    await awaitEvent(document, 'selectionchange');
    assert.isFalse(pdfViewerHasClass('is-selecting'));
  });

  describe('#uri', () => {
    it('returns current PDF document URI', async () => {
      const uri = await createPDFIntegration().uri();
      assert.equal(uri, 'https://example.com/test.pdf');
    });
  });

  describe('#getMetadata', () => {
    it('returns current PDF document metadata', async () => {
      const metadata = await createPDFIntegration().getMetadata();
      assert.deepEqual(metadata, {
        title: 'Dummy PDF',
        documentFingerprint: 'abc',
      });
    });
  });

  describe('#anchor', () => {
    it('anchors provided selectors', async () => {
      pdfIntegration = createPDFIntegration();
      fakePDFAnchoring.anchor.returns({});
      const selectors = [];

      const range = await pdfIntegration.anchor({}, selectors);

      assert.calledWith(fakePDFAnchoring.anchor, sinon.match.any, selectors);
      assert.equal(range, fakePDFAnchoring.anchor());
    });
  });

  describe('#describe', () => {
    it('generates selectors for passed range', async () => {
      pdfIntegration = createPDFIntegration();
      const range = {};
      fakePDFAnchoring.describe.returns([]);

      const selectors = await pdfIntegration.describe({}, range);

      assert.calledWith(fakePDFAnchoring.describe, sinon.match.any, range);
      assert.equal(selectors, fakePDFAnchoring.describe());
    });
  });

  describe('#destroy', () => {
    it('removes CSS classes to override PDF.js styles', () => {
      pdfIntegration = createPDFIntegration();

      pdfIntegration.destroy();
      pdfIntegration = null;

      assert.isFalse(
        fakePDFViewerApplication.pdfViewer.viewer.classList.contains(
          'has-transparent-text-layer'
        )
      );
    });
  });

  function getWarningBanner() {
    return document.querySelector('hypothesis-banner');
  }

  it('does not show a warning when PDF has selectable text', async () => {
    fakePDFAnchoring.documentHasText.resolves(true);

    pdfIntegration = createPDFIntegration();
    await delay(0); // Wait for text check to complete.

    assert.called(fakePDFAnchoring.documentHasText);
    assert.isNull(getWarningBanner());
  });

  it('does not show a warning if PDF does not load', async () => {
    fakePDFMetadata.getUri.rejects(new Error('Something went wrong'));

    pdfIntegration = createPDFIntegration();
    await delay(0); // Wait for text check to complete.

    assert.notCalled(fakePDFAnchoring.documentHasText);
    assert.isNull(getWarningBanner());
  });

  it('shows a warning when PDF has no selectable text', async () => {
    fakePDFAnchoring.documentHasText.resolves(false);

    pdfIntegration = createPDFIntegration();
    await delay(0); // Wait for text check to complete.

    assert.called(fakePDFAnchoring.documentHasText);
    const banner = getWarningBanner();
    assert.isNotNull(banner);
    assert.include(
      banner.shadowRoot.textContent,
      'This PDF does not contain selectable text'
    );
  });

  context('when the PDF viewer content changes', () => {
    async function triggerUpdate() {
      const element = document.createElement('div');
      fakePDFViewerApplication.pdfViewer.viewer.appendChild(element);

      // Give MutationObserver a chance to trigger its callback.
      await delay(0);
    }

    function createAnchor() {
      const anchor = {
        anchor: {},
        highlights: [document.createElement('div')],
        range: document.createRange(),
      };
      fakeAnnotator.anchors.push(anchor);
      return anchor;
    }

    it('re-anchors annotations whose highlights are no longer in the page', async () => {
      const anchor = createAnchor();
      pdfIntegration = createPDFIntegration();

      await triggerUpdate();

      assert.equal(anchor.highlights.length, 0);
      assert.isUndefined(anchor.range);
      assert.calledWith(fakeAnnotator.anchor, anchor.annotation);
    });

    it('does not re-anchor annotations whose highlights are still in the page', async () => {
      const anchor = createAnchor();
      pdfIntegration = createPDFIntegration();

      document.body.appendChild(anchor.highlights[0]);
      await triggerUpdate();

      assert.equal(anchor.highlights.length, 1);
      assert.ok(anchor.range);
      assert.notCalled(fakeAnnotator.anchor);
    });
  });

  describe('#contentContainer', () => {
    let container;
    afterEach(() => {
      container?.remove();
    });

    it('returns main PDF viewer content element', () => {
      container = document.createElement('div');
      container.id = 'viewerContainer';
      document.body.appendChild(container);

      pdfIntegration = createPDFIntegration();

      assert.equal(pdfIntegration.contentContainer(), container);
    });
  });

  describe('#fitSideBySide', () => {
    const sandbox = sinon.createSandbox();
    afterEach(() => {
      sandbox.restore();
    });

    function pdfContainer() {
      return fakePDFViewerApplication.appConfig.appContainer;
    }

    it('resizes and activates side-by-side mode when sidebar expanded', () => {
      sandbox.stub(window, 'innerWidth').value(1350);
      pdfIntegration = createPDFIntegration();

      const active = pdfIntegration.fitSideBySide({
        expanded: true,
        width: 428,
        height: 728,
      });

      assert.isTrue(active);
      assert.calledOnce(fakePDFViewerApplication.pdfViewer.update);
      assert.equal(pdfContainer().style.width, 1350 - 428 + 'px');
    });

    /**
     * For each of the relative zoom modes supported by PDF.js, PDFSidebar
     * should re-set the `currentScale` value, which will prompt PDF.js
     * to re-calculate the zoom/viewport. Then, `pdfViewer.update()` will
     * re-render the PDF pages as needed for the dirtied viewport/scaling.
     * These tests are primarily for test coverage of these zoom modes.
     */
    ['auto', 'page-fit', 'page-width'].forEach(zoomMode => {
      it('activates side-by-side mode for each relative zoom mode', () => {
        fakePDFViewerApplication.pdfViewer.currentScaleValue = zoomMode;
        sandbox.stub(window, 'innerWidth').value(1350);
        pdfIntegration = createPDFIntegration();

        const active = pdfIntegration.fitSideBySide({
          expanded: true,
          width: 428,
          height: 728,
        });

        assert.isTrue(active);
        assert.calledOnce(fakePDFViewerApplication.pdfViewer.update);
        assert.equal(pdfContainer().style.width, 1350 - 428 + 'px');
      });
    });

    it('deactivates side-by-side mode when sidebar collapsed', () => {
      sandbox.stub(window, 'innerWidth').value(1350);
      pdfIntegration = createPDFIntegration();

      const active = pdfIntegration.fitSideBySide({
        expanded: false,
        width: 428,
        height: 728,
      });

      assert.isFalse(active);
      assert.equal(pdfContainer().style.width, 'auto');
    });

    it('does not activate side-by-side mode if there is not enough room', () => {
      sandbox.stub(window, 'innerWidth').value(800);
      pdfIntegration = createPDFIntegration();

      const active = pdfIntegration.fitSideBySide({
        expanded: true,
        width: 428,
        height: 728,
      });

      assert.isFalse(active);
      assert.calledOnce(fakePDFViewerApplication.pdfViewer.update);
      assert.equal(pdfContainer().style.width, 'auto');
    });
  });

  describe('#scrollToAnchor', () => {
    it('scrolls to first highlight of anchor', async () => {
      const highlight = document.createElement('div');
      const offset = 42;
      const integration = createPDFIntegration();
      fakeScrollUtils.offsetRelativeTo
        .withArgs(highlight, integration.contentContainer())
        .returns(offset);

      const anchor = { highlights: [highlight] };
      await integration.scrollToAnchor(anchor);

      assert.calledOnce(fakeScrollUtils.scrollElement);
      assert.calledWith(
        fakeScrollUtils.scrollElement,
        integration.contentContainer(),
        offset
      );
    });

    it('does not scroll if anchor has no highlights', async () => {
      const integration = createPDFIntegration();
      const anchor = {};

      await integration.scrollToAnchor(anchor);

      assert.notCalled(fakeScrollUtils.scrollElement);
    });

    /**
     * Create an anchor whose highlight is inside a placeholder for a non-rendered
     * PDF page.
     */
    function createPlaceholderHighlight() {
      const container = document.createElement('div');
      const placeholder = createPlaceholder(container);
      const highlight = document.createElement('div');
      placeholder.append(highlight);
      return highlight;
    }

    it('waits for anchors in placeholders to be re-anchored and scrolls to final highlight', async () => {
      const placeholderHighlight = createPlaceholderHighlight();
      const integration = createPDFIntegration();
      fakeScrollUtils.offsetRelativeTo
        .withArgs(placeholderHighlight, integration.contentContainer())
        .returns(50);
      const annotation = { $tag: 'tag1' };
      const anchor = { annotation, highlights: [placeholderHighlight] };

      // Check that the PDF content was scrolled to the approximate position of
      // the anchor, indicated by the placeholder.
      const scrollDone = integration.scrollToAnchor(anchor);
      assert.calledWith(
        fakeScrollUtils.scrollElement,
        integration.contentContainer(),
        50
      );

      // Simulate a delay while rendering of the text layer for the page happens
      // and re-anchoring completes.
      await delay(5);

      // Create a new anchor for the annotation created by re-anchoring.
      const finalHighlight = document.createElement('div');
      fakeScrollUtils.scrollElement.resetHistory();
      fakeAnnotator.anchors.push({
        annotation,
        highlights: [finalHighlight],
      });
      fakeScrollUtils.offsetRelativeTo
        .withArgs(finalHighlight, integration.contentContainer())
        .returns(150);

      await scrollDone;

      // Check that we scrolled to the location of the final highlight.
      assert.calledWith(
        fakeScrollUtils.scrollElement,
        integration.contentContainer(),
        150
      );
    });

    it('skips scrolling to final anchor if re-anchoring does not complete within timeout', async () => {
      const highlight = createPlaceholderHighlight();
      const integration = createPDFIntegration({ reanchoringMaxWait: 10 });
      const annotation = { $tag: 'tag1' };
      const anchor = { annotation, highlights: [highlight] };

      const scrollDone = integration.scrollToAnchor(anchor);
      await delay(5); // Simulate delay in re-anchoring
      fakeScrollUtils.scrollElement.resetHistory();

      // Wait until the re-anchoring timeout expires.
      await scrollDone;

      assert.notCalled(fakeScrollUtils.scrollElement);
    });

    it('skips scrolling to final anchor if re-anchoring fails', async () => {
      const placeholderHighlight = createPlaceholderHighlight();
      const integration = createPDFIntegration();
      const annotation = { $tag: 'tag1' };
      const anchor = { annotation, highlights: [placeholderHighlight] };

      const scrollDone = integration.scrollToAnchor(anchor);
      await delay(5);
      fakeScrollUtils.scrollElement.resetHistory();

      // Simulate re-anchoring failing (anchor has no `highlights` field). The
      // PDF should remain scrolled to the location of the placeholder highlight.
      fakeAnnotator.anchors.push({ annotation });
      await scrollDone;

      assert.notCalled(fakeScrollUtils.scrollElement);
    });
  });
});
