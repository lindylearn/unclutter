import EventEmitter from 'tiny-emitter';

import { PDFMetadata } from '../pdf-metadata';

/**
 * Fake implementation of PDF.js `window.PDFViewerApplication.metadata`.
 */
class FakeMetadata {
  /**
   * Initialize the metadata dictionary.
   *
   * @param {Object} metadata - A key/value dictionary of metadata fields.
   */
  constructor(metadata) {
    this._metadata = metadata;
  }

  get(key) {
    return this._metadata[key];
  }

  has(key) {
    return this._metadata.hasOwnProperty(key);
  }
}

/**
 * Fake implementation of PDF.js `window.PDFViewerApplication.pdfDocument`.
 */
class FakePDFDocumentProxy {
  constructor({
    contentDispositionFilename = null,
    fingerprint,
    info,
    metadata = null,

    // Whether to expose fingerprints via the new API (after
    // https://github.com/mozilla/pdf.js/pull/13661) or the old one.
    newFingerprintAPI = true,
  }) {
    this._contentDispositionFilename = contentDispositionFilename;
    this._info = info;
    this._metadata = metadata;

    if (newFingerprintAPI) {
      this.fingerprints = [fingerprint, null];
    } else {
      this.fingerprint = fingerprint;
    }
  }

  async getMetadata() {
    return {
      contentDispositionFilename: this._contentDispositionFilename,
      info: this._info,
      metadata: this._metadata,
    };
  }
}

/**
 * Fake implementation of PDF.js `window.PDFViewerApplication` entry point.
 *
 * This fake only implements the parts that concern document metadata.
 */
class FakePDFViewerApplication {
  /**
   * Initialize the "PDF viewer" as it would be when loading a document or
   * when a document fails to load.
   *
   * @param {string} url - Fake PDF URL
   * @param {Object} options -
   *   Options to simulate APIs of different versions of PDF.js.
   *
   *   @prop {boolean} domEvents - Whether events are emitted on the DOM
   *   @prop {boolean} eventBusEvents - Whether the `eventBus` API is enabled
   *   @prop {boolean} initializedPromise - Whether the `initializedPromise` API is enabled
   *   @prop {boolean} newFingerprintAPI - Whether to emulate the new fingerprints API
   */
  constructor(
    url = '',
    {
      domEvents = false,
      eventBusEvents = true,
      initializedPromise = true,
      newFingerprintAPI = true,
    } = {}
  ) {
    this.url = url;
    this.documentInfo = undefined;
    this.metadata = undefined;
    this.pdfDocument = null;
    this.dispatchDOMEvents = domEvents;
    this.initialized = false;
    this.newFingerprintAPI = newFingerprintAPI;

    // Use `EventEmitter` as a fake version of PDF.js's `EventBus` class as the
    // API for subscribing to events is the same.
    if (eventBusEvents) {
      this.eventBus = new EventEmitter();
    }

    const initPromise = new Promise(resolve => {
      this._resolveInitializedPromise = () => {
        this.initialized = true;
        resolve();
      };
    });

    if (initializedPromise) {
      this.initializedPromise = initPromise;
    }
  }

  /**
   * Simulate completion of PDF document loading.
   */
  finishLoading({
    contentDispositionFilename,
    url,
    fingerprint,
    metadata,
    title,
    eventName = 'documentload',
  }) {
    this.url = url;
    this.downloadComplete = true;

    const info = {};
    if (title) {
      info.Title = title;
    }

    this.pdfDocument = new FakePDFDocumentProxy({
      contentDispositionFilename,
      fingerprint,
      info,
      metadata: metadata ? new FakeMetadata(metadata) : null,
      newFingerprintAPI: this.newFingerprintAPI,
    });

    if (this.dispatchDOMEvents) {
      const event = document.createEvent('Event');
      event.initEvent(eventName, false, false);
      window.dispatchEvent(event);
    }
    this.eventBus?.emit(eventName);
  }

  /**
   * Simulate PDF viewer initialization completing.
   *
   * At this point the event bus becomes available.
   */
  completeInit() {
    this._resolveInitializedPromise();
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('PDFMetadata', () => {
  [
    {
      // PDF.js < 1.6.210: `documentload` event dispatched via DOM.
      eventName: 'documentload',
      domEvents: true,
      eventBusEvents: false,
      initializedPromise: false,
    },
    {
      // PDF.js >= 1.6.210: Event dispatch moved to internal event bus.
      eventName: 'documentload',
      domEvents: false,
      eventBusEvents: true,
      initializedPromise: false,
    },
    {
      // PDF.js >= 2.1.266: Deprecated `documentload` event was removed.
      eventName: 'documentloaded',
      domEvents: false,
      eventBusEvents: true,
      initializedPromise: false,
    },
    {
      // PDF.js >= 2.4.456: `initializedPromise` API was introduced.
      eventName: 'documentloaded',
      domEvents: false,
      eventBusEvents: true,
      initializedPromise: true,
    },
  ].forEach(
    ({ eventName, domEvents, eventBusEvents, initializedPromise }, i) => {
      it(`waits for PDF to load (${i})`, async () => {
        const fakeApp = new FakePDFViewerApplication('', {
          domEvents,
          eventBusEvents,
          initializedPromise,
        });
        const pdfMetadata = new PDFMetadata(fakeApp);

        fakeApp.completeInit();

        // Request the PDF URL before the document has finished loading.
        const uriPromise = pdfMetadata.getUri();

        // Simulate a short delay in completing PDF.js initialization and
        // loading the PDF.
        //
        // Note that this delay is longer than the `app.initialized` polling
        // interval in `pdfViewerInitialized`.
        await delay(10);

        fakeApp.finishLoading({
          eventName,
          url: 'http://fake.com',
          fingerprint: 'fakeFingerprint',
        });

        assert.equal(await uriPromise, 'http://fake.com/');
      });
    }
  );

  // The `initializedPromise` param simulates different versions of PDF.js with
  // and without the `PDFViewerApplication.initializedPromise` API.
  [true, false].forEach(initializedPromise => {
    it('does not wait for the PDF to load if it has already loaded', async () => {
      const fakePDFViewerApplication = new FakePDFViewerApplication('', {
        initializedPromise,
      });
      fakePDFViewerApplication.completeInit();
      fakePDFViewerApplication.finishLoading({
        url: 'http://fake.com',
        fingerprint: 'fakeFingerprint',
      });
      const pdfMetadata = new PDFMetadata(fakePDFViewerApplication);
      const uri = await pdfMetadata.getUri();
      assert.equal(uri, 'http://fake.com/');
    });
  });

  const testMetadata = {
    fingerprint: 'fakeFingerprint',
    title: 'fakeTitle',
    metadata: {
      'dc:title': 'dcFakeTitle',
    },
    url: 'http://fake.com/',
  };

  function createPDFMetadata(metadata = testMetadata, viewerOptions) {
    const fakePDFViewerApplication = new FakePDFViewerApplication(
      '',
      viewerOptions
    );
    fakePDFViewerApplication.completeInit();
    fakePDFViewerApplication.finishLoading(metadata);
    return {
      fakePDFViewerApplication,
      pdfMetadata: new PDFMetadata(fakePDFViewerApplication),
    };
  }

  describe('#getUri', () => {
    ['http://fake.com/', 'https://example.com/test.pdf'].forEach(pdfURL => {
      it('returns the PDF URL if it is an HTTP(S) URL', async () => {
        const { pdfMetadata } = createPDFMetadata({ url: pdfURL });
        const uri = await pdfMetadata.getUri();
        assert.equal(uri, pdfURL);
      });
    });

    [true, false].forEach(newFingerprintAPI => {
      it('returns the fingerprint as a URN when the PDF URL is a file:// URL', async () => {
        const { pdfMetadata } = createPDFMetadata(
          {
            url: 'file:///test.pdf',
            fingerprint: 'fakeFingerprint',
          },
          { newFingerprintAPI }
        );
        const uri = await pdfMetadata.getUri();
        assert.equal(uri, 'urn:x-pdf:fakeFingerprint');
      });
    });

    it('resolves relative URLs', async () => {
      const { fakePDFViewerApplication, pdfMetadata } = createPDFMetadata({
        url: 'index.php?action=download&file_id=wibble',
        fingerprint: 'fakeFingerprint',
      });

      const uri = await pdfMetadata.getUri();

      const expected = new URL(
        fakePDFViewerApplication.url,
        document.location.href
      ).toString();
      assert.equal(uri, expected);
    });
  });

  describe('#getMetadata', () => {
    [true, false].forEach(newFingerprintAPI => {
      it('returns the document fingerprint in the `documentFingerprint` property', async () => {
        const { pdfMetadata } = createPDFMetadata(testMetadata, {
          newFingerprintAPI,
        });
        const metadata = await pdfMetadata.getMetadata();
        assert.equal(metadata.documentFingerprint, testMetadata.fingerprint);
      });
    });

    it('returns the PDF URL in the `links` array', async () => {
      const { pdfMetadata } = createPDFMetadata();
      const metadata = await pdfMetadata.getMetadata();
      assert.deepInclude(metadata.link, {
        href: testMetadata.url,
      });
    });

    it('returns the document fingerprint in the `links` array', async () => {
      const { pdfMetadata } = createPDFMetadata();
      const metadata = await pdfMetadata.getMetadata();
      assert.deepInclude(metadata.link, {
        href: `urn:x-pdf:${testMetadata.fingerprint}`,
      });
    });

    it('does not return file:// URLs in `links` array', async () => {
      const { pdfMetadata } = createPDFMetadata({
        fingerprint: 'fakeFingerprint',
        url: 'file://fake.pdf',
      });

      const metadata = await pdfMetadata.getMetadata();

      const fileLink = metadata.link.find(link =>
        link.href.includes('file://')
      );
      assert.isUndefined(fileLink);
    });

    // In order, the title is obtained from:
    //  1. The `dc:title` field
    //  2. The `documentInfo.Title` field
    //  3. The `title` property of the HTML `document` (which PDF.js in turn
    //     initializes based on the filename from the `Content-Disposition` header
    //     or URL if that is not available)

    it('gets the title from the dc:title field', async () => {
      const { pdfMetadata } = createPDFMetadata();
      const metadata = await pdfMetadata.getMetadata();
      assert.equal(metadata.title, testMetadata.metadata['dc:title']);
    });

    it('gets the title from the documentInfo.Title field', async () => {
      const { pdfMetadata } = createPDFMetadata({
        title: 'Some title',
        url: 'http://fake.com/',
      });

      const metadata = await pdfMetadata.getMetadata();

      assert.equal(metadata.title, 'Some title');
    });

    it('gets the title from the `Content-Disposition` header', async () => {
      const { pdfMetadata } = createPDFMetadata({
        contentDispositionFilename: 'some-file.pdf',
        url: 'http://fake.com/test.pdf',
      });

      const metadata = await pdfMetadata.getMetadata();

      assert.equal(metadata.title, 'some-file.pdf');
    });

    it('gets the title from the URL', async () => {
      const { pdfMetadata } = createPDFMetadata({
        url: 'http://fake.com/a-file.pdf',
      });

      const metadata = await pdfMetadata.getMetadata();

      assert.equal(metadata.title, 'a-file.pdf');
    });

    [
      null, // Missing URL
      '', // Invalid URL
      'https://example.com', // Missing path
      'https://example.com/', // Empty string after last `/` in path
    ].forEach(url => {
      it('returns an empty string if there is no title metadata or filename in URL', async () => {
        const { pdfMetadata } = createPDFMetadata({ url });

        // Earlier versions of the client used `document.title` as a fallback,
        // but we changed this. See https://github.com/hypothesis/client/issues/3372.
        document.title = 'Ignore me';
        const metadata = await pdfMetadata.getMetadata();

        assert.equal(metadata.title, '');
      });
    });
  });
});
