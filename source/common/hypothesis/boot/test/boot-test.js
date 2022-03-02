import { bootHypothesisClient, bootSidebarApp } from '../boot';
import { $imports } from '../boot';

function assetUrl(url) {
  return `https://marginal.ly/client/build/${url}`;
}

describe('bootstrap', () => {
  let fakePolyfills;
  let iframe;

  beforeEach(() => {
    iframe = document.createElement('iframe');
    document.body.appendChild(iframe);

    fakePolyfills = {
      requiredPolyfillSets: sinon.stub().returns([]),
    };

    $imports.$mock({
      './polyfills': fakePolyfills,
    });
  });

  afterEach(() => {
    $imports.$restore();
    iframe.remove();
  });

  function runBoot(app = 'annotator') {
    const assetNames = [
      // Polyfills
      'scripts/polyfills-es2017.bundle.js',

      // Annotation layer
      'scripts/annotator.bundle.js',
      'styles/annotator.css',
      'styles/pdfjs-overrides.css',

      // Sidebar app
      'scripts/sentry.bundle.js',
      'scripts/katex.bundle.js',
      'scripts/showdown.bundle.js',
      'scripts/sidebar.bundle.js',

      'styles/katex.min.css',
      'styles/sidebar.css',
    ];

    const manifest = assetNames.reduce((manifest, path) => {
      const url = path.replace(/\.([a-z]+)$/, '.1234.$1');
      manifest[path] = url;
      return manifest;
    }, {});

    let extraSettings = {};
    let bootApp;
    if (app === 'annotator') {
      bootApp = bootHypothesisClient;
    } else if (app === 'sidebar') {
      bootApp = bootSidebarApp;
      extraSettings.apiUrl = 'https://marginal.ly/api/';
    }

    bootApp(iframe.contentDocument, {
      sidebarAppUrl: 'https://marginal.ly/app.html',
      assetRoot: 'https://marginal.ly/client/',
      manifest,
      ...extraSettings,
    });
  }

  function findAssets(doc_) {
    const scripts = Array.from(
      doc_.querySelectorAll('script[data-hypothesis-asset]')
    ).map(el => {
      return el.src;
    });

    const styles = Array.from(
      doc_.querySelectorAll('link[rel="stylesheet"][data-hypothesis-asset]')
    ).map(el => {
      return el.href;
    });

    return scripts.concat(styles).sort();
  }

  describe('bootHypothesisClient', () => {
    it('loads assets for the annotation layer', () => {
      runBoot('annotator');
      const expectedAssets = [
        'scripts/annotator.bundle.1234.js',
        'styles/annotator.1234.css',
        'styles/pdfjs-overrides.1234.css',
      ].map(assetUrl);

      assert.deepEqual(findAssets(iframe.contentDocument), expectedAssets);
    });

    it('creates the link to the sidebar iframe', () => {
      runBoot('annotator');

      const sidebarAppLink = iframe.contentDocument.querySelector(
        'link[type="application/annotator+html"]'
      );
      assert.ok(sidebarAppLink);
      assert.isTrue(sidebarAppLink.hasAttribute('data-hypothesis-asset'));
      assert.equal(sidebarAppLink.href, 'https://marginal.ly/app.html');
    });

    it('does nothing if Hypothesis is already loaded in the document', () => {
      const link = iframe.contentDocument.createElement('link');
      link.type = 'application/annotator+html';
      iframe.contentDocument.head.appendChild(link);

      runBoot('annotator');

      assert.deepEqual(findAssets(iframe.contentDocument), []);
    });

    it('loads polyfills if required', () => {
      fakePolyfills.requiredPolyfillSets.callsFake(sets =>
        sets.filter(s => s.match(/es2017/))
      );

      runBoot('annotator');

      const polyfillsLoaded = findAssets(iframe.contentDocument).filter(a =>
        a.match(/polyfills/)
      );
      assert.called(fakePolyfills.requiredPolyfillSets);
      assert.deepEqual(polyfillsLoaded, [
        assetUrl('scripts/polyfills-es2017.bundle.1234.js'),
      ]);
    });
  });

  describe('bootSidebarApp', () => {
    it('loads assets for the sidebar application', () => {
      runBoot('sidebar');
      const expectedAssets = [
        'scripts/katex.bundle.1234.js',
        'scripts/sentry.bundle.1234.js',
        'scripts/showdown.bundle.1234.js',
        'scripts/sidebar.bundle.1234.js',
        'styles/katex.min.1234.css',
        'styles/sidebar.1234.css',
      ].map(assetUrl);

      assert.deepEqual(findAssets(iframe.contentDocument), expectedAssets);
    });

    it('preloads /api/ and /api/links responses from Hypothesis API', () => {
      runBoot('sidebar');

      const preloadLinks = [
        ...iframe.contentDocument.querySelectorAll('link[rel=preload]'),
      ];
      preloadLinks.sort((a, b) => a.href.localeCompare(b.href));

      assert.equal(preloadLinks.length, 2);

      assert.equal(preloadLinks[0].href, 'https://marginal.ly/api/');
      assert.equal(preloadLinks[0].as, 'fetch');
      assert.equal(preloadLinks[0].crossOrigin, 'anonymous');

      assert.equal(preloadLinks[1].href, 'https://marginal.ly/api/links');
      assert.equal(preloadLinks[1].as, 'fetch');
      assert.equal(preloadLinks[1].crossOrigin, 'anonymous');
    });

    it('loads polyfills if required', () => {
      fakePolyfills.requiredPolyfillSets.callsFake(sets =>
        sets.filter(s => s.match(/es2017/))
      );

      runBoot('sidebar');

      const polyfillsLoaded = findAssets(iframe.contentDocument).filter(a =>
        a.match(/polyfills/)
      );
      assert.called(fakePolyfills.requiredPolyfillSets);
      assert.deepEqual(polyfillsLoaded, [
        assetUrl('scripts/polyfills-es2017.bundle.1234.js'),
      ]);
    });
  });
});
