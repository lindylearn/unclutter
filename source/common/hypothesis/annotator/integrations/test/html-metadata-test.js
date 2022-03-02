/*
 ** Adapted from:
 ** https://github.com/openannotation/annotator/blob/v1.2.x/test/spec/plugin/document_spec.coffee
 **
 ** Annotator v1.2.10
 ** https://github.com/openannotation/annotator
 **
 ** Copyright 2015, the Annotator project contributors.
 ** Dual licensed under the MIT and GPLv3 licenses.
 ** https://github.com/openannotation/annotator/blob/master/LICENSE
 */

import { HTMLMetadata } from '../html-metadata';

describe('HTMLMetadata', () => {
  let tempDocument;
  let tempDocumentHead;
  let testDocument = null;

  beforeEach(() => {
    tempDocument = document.createDocumentFragment();
    tempDocument.location = { href: 'https://example.com' };
    tempDocumentHead = document.createElement('head');
    tempDocument.appendChild(tempDocumentHead);

    testDocument = new HTMLMetadata({
      document: tempDocument,
    });
  });

  describe('#getDocumentMetadata', () => {
    let metadata = null;

    beforeEach(() => {
      // Add some metadata to the page
      tempDocumentHead.innerHTML = `
        <link rel="alternate" href="foo.pdf" type="application/pdf"></link>
        <link rel="alternate" href="foo.doc" type="application/msword"></link>
        <link rel="bookmark" href="http://example.com/bookmark"></link>
        <link rel="shortlink" href="http://example.com/bookmark/short"></link>
        <link rel="alternate" href="es/foo.html" hreflang="es" type="text/html"></link>
        <meta name="citation_doi" content="10.1175/JCLI-D-11-00015.1">
        <meta name="citation_title" content="Foo">
        <meta name="citation_pdf_url" content="foo.pdf">
        <meta name="dc.identifier" content="doi:10.1175/JCLI-D-11-00015.1">
        <meta name="dc:identifier" content="foobar-abcxyz">
        <meta name="dc.relation.ispartof" content="isbn:123456789">
        <meta name="DC.type" content="Article">
        <meta property="og:url" content="http://example.com">
        <meta name="twitter:site" content="@okfn">
        <link rel="icon" href="http://example.com/images/icon.ico"></link>
        <meta name="eprints.title" content="Computer Lib / Dream Machines">
        <meta name="prism.title" content="Literary Machines">
        <link rel="alternate" href="feed" type="application/rss+xml"></link>
        <link rel="canonical" href="http://example.com/canonical"></link>
      `;

      metadata = testDocument.getDocumentMetadata();
    });

    it('should return title', () => {
      // Populate all supported title sources.
      tempDocument.title = 'Test document title';
      tempDocumentHead.innerHTML = `
  <meta name="eprints.title" content="Eprints title">
  <meta name="prism.title" content="PRISM title">
  <meta name="dc.title" content="Dublin Core title">
  <meta name="citation_title" content="Highwire title">
  <meta property="og:title" content="Facebook title">
  <meta name="twitter:title" content="Twitter title">
  `;

      // Title values, in order of source priority.
      const sources = [
        {
          metaName: 'citation_title',
          value: 'Highwire title',
        },
        {
          metaName: 'eprints.title',
          value: 'Eprints title',
        },
        {
          metaName: 'prism.title',
          value: 'PRISM title',
        },
        {
          metaAttr: 'property',
          metaName: 'og:title',
          value: 'Facebook title',
        },
        {
          metaName: 'twitter:title',
          value: 'Twitter title',
        },
        {
          metaName: 'dc.title',
          value: 'Dublin Core title',
        },
        {
          value: 'Test document title',
        },
      ];

      for (let source of sources) {
        const metadata = testDocument.getDocumentMetadata();
        assert.equal(metadata.title, source.value);

        // Remove this title source. The next iteration should return the next
        // title value in the priority order.
        if (source.metaName) {
          const attr = source.metaAttr ?? 'name';
          tempDocumentHead
            .querySelector(`meta[${attr}="${source.metaName}"]`)
            .remove();
        }
      }
    });

    it('should return links with absolute hrefs and types', () => {
      assert.ok(metadata.link);
      assert.equal(metadata.link.length, 10);
      assert.equal(metadata.link[1].rel, 'alternate');
      assert.match(metadata.link[1].href, /^.+foo\.pdf$/);
      assert.equal(metadata.link[1].type, 'application/pdf');
      assert.equal(metadata.link[2].rel, 'alternate');
      assert.match(metadata.link[2].href, /^.+foo\.doc$/);
      assert.equal(metadata.link[2].type, 'application/msword');
      assert.equal(metadata.link[3].rel, 'bookmark');
      assert.equal(metadata.link[3].href, 'http://example.com/bookmark');
      assert.equal(metadata.link[4].rel, 'shortlink');
      assert.equal(metadata.link[4].href, 'http://example.com/bookmark/short');
      assert.equal(metadata.link[5].rel, 'canonical');
      assert.equal(metadata.link[5].href, 'http://example.com/canonical');
      assert.equal(metadata.link[6].href, 'doi:10.1175/JCLI-D-11-00015.1');
      assert.match(metadata.link[7].href, /.+foo\.pdf$/);
      assert.equal(metadata.link[7].type, 'application/pdf');
      assert.equal(metadata.link[8].href, 'doi:10.1175/JCLI-D-11-00015.1');

      // Link derived from dc resource identifiers in the form of urn:x-dc:<container>/<identifier>
      // Where <container> is the percent-encoded value of the last dc.relation.ispartof meta element
      // and <identifier> is the percent-encoded value of the last dc.identifier meta element.
      assert.equal(
        metadata.link[9].href,
        'urn:x-dc:isbn%3A123456789/foobar-abcxyz'
      );
    });

    it('should ignore atom and RSS feeds and alternate languages', () => {
      assert.equal(metadata.link.length, 10);
    });

    it('should return Highwire metadata', () => {
      assert.ok(metadata.highwire);
      assert.deepEqual(metadata.highwire.pdf_url, ['foo.pdf']);
      assert.deepEqual(metadata.highwire.doi, ['10.1175/JCLI-D-11-00015.1']);
      assert.deepEqual(metadata.highwire.title, ['Foo']);
    });

    it('should return Dublin Core metadata', () => {
      assert.ok(metadata.dc);
      assert.deepEqual(metadata.dc.identifier, [
        'doi:10.1175/JCLI-D-11-00015.1',
        'foobar-abcxyz',
      ]);
      assert.deepEqual(metadata.dc['relation.ispartof'], ['isbn:123456789']);
      assert.deepEqual(metadata.dc.type, ['Article']);
    });

    it('should return Facebook metadata', () => {
      assert.ok(metadata.facebook);
      assert.deepEqual(metadata.facebook.url, ['http://example.com']);
    });

    it('should return eprints metadata', () => {
      assert.ok(metadata.eprints);
      assert.deepEqual(metadata.eprints.title, [
        'Computer Lib / Dream Machines',
      ]);
    });

    it('should return PRISM metadata', () => {
      assert.ok(metadata.prism);
      assert.deepEqual(metadata.prism.title, ['Literary Machines']);
    });

    it('should return Twitter card metadata', () => {
      assert.ok(metadata.twitter);
      assert.deepEqual(metadata.twitter.site, ['@okfn']);
    });

    it('should return favicon URL', () => {
      assert.equal(metadata.favicon, 'http://example.com/images/icon.ico');
    });

    it('should set `documentFingerprint` to the dc resource identifiers URN href', () => {
      assert.equal(metadata.documentFingerprint, metadata.link[9].href);
    });

    it('should ignore `<link>` tags with invalid URIs', () => {
      tempDocumentHead.innerHTML = `
        <link rel="alternate" href="https://example.com/foo">
        <link rel="alternate" href="http://a:b:c">
      `;

      const metadata = testDocument.getDocumentMetadata();

      // There should be one link with the document location and one for the
      // valid `<link>` tag.
      assert.deepEqual(metadata.link.length, 2);
      assert.deepEqual(metadata.link[1], {
        rel: 'alternate',
        href: 'https://example.com/foo',
        type: '',
      });
    });

    it('should ignore favicons with invalid URIs', () => {
      tempDocumentHead.innerHTML = `
        <link rel="favicon" href="http://a:b:c">
      `;
      const metadata = testDocument.getDocumentMetadata();
      assert.isUndefined(metadata.favicon);
    });

    it('should ignore `<meta>` PDF links with invalid URIs', () => {
      tempDocumentHead.innerHTML = `
        <meta name="citation_pdf_url" content="http://a:b:c">
      `;
      const metadata = testDocument.getDocumentMetadata();

      // There should only be one link for the document's location.
      // The invalid PDF link should be ignored.
      assert.equal(metadata.link.length, 1);
    });
  });

  describe('#_absoluteUrl', () => {
    it('should add the protocol when the url starts with two slashes', () => {
      const result = testDocument._absoluteUrl('//example.com/');
      const expected = `${document.location.protocol}//example.com/`;
      assert.equal(result, expected);
    });

    it('should add a trailing slash when given an empty path', () => {
      const result = testDocument._absoluteUrl('http://example.com');
      assert.equal(result, 'http://example.com/');
    });

    it('should make a relative path into an absolute url', () => {
      const result = testDocument._absoluteUrl('path');
      const expected =
        document.location.protocol +
        '//' +
        document.location.host +
        document.location.pathname.replace(/[^/]+$/, '') +
        'path';
      assert.equal(result, expected);
    });

    it('should make an absolute path into an absolute url', () => {
      const result = testDocument._absoluteUrl('/path');
      const expected =
        document.location.protocol + '//' + document.location.host + '/path';
      assert.equal(result, expected);
    });
  });

  describe('#uri', () => {
    beforeEach(() => {
      // Remove any existing canonical links which would otherwise override the
      // document's own location.
      const canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) {
        canonicalLink.remove();
      }
    });

    // Create a blank HTML document with a faked `href` and `baseURI` and
    // return a `DocumentMeta` instance which reads metadata from it.
    const createDoc = function (href, baseURI, htmlDoc) {
      if (!htmlDoc) {
        // Create a blank DOM DocumentMeta
        htmlDoc = document.implementation.createHTMLDocument();
      }

      // `DocumentMeta.location` is not overridable. In order to fake the
      // location in tests, create a proxy object in front of our blank HTML
      // document.
      const fakeDocument = {
        createElement: htmlDoc.createElement.bind(htmlDoc), // eslint-disable-line no-restricted-properties
        baseURI: baseURI ?? href,
        querySelectorAll: htmlDoc.querySelectorAll.bind(htmlDoc), // eslint-disable-line no-restricted-properties
        location: {
          href,
        },
      };
      const doc = new HTMLMetadata({
        document: fakeDocument,
      });
      return doc;
    };

    [
      'http://publisher.org/book',
      'https://publisher.org/book',
      'file:///Users/jim/book',
    ].forEach(href =>
      it("should return the document's URL if it has an allowed scheme", () => {
        const baseURI = 'https://publisher.org/';
        const doc = createDoc(href, baseURI);
        assert.equal(doc.uri(), href);
      })
    );

    it("should return the baseURI if the document's URL does not have an allowed scheme", () => {
      const href = 'blob:1234-5678';
      const baseURI = 'https://publisher.org/book';
      const doc = createDoc(href, baseURI);
      assert.equal(doc.uri(), baseURI);
    });

    [
      // The base URI is not available in IE if the document has no `<base>`
      // tags. This is a limitation of `document-base-uri`.
      ['https://publisher.org/article', undefined],
      // Ignore base URIs with non-HTTP/HTTPS/file protocols, which can be
      // created by a `<base>` tag.
      ['blob:1234', 'doi:foo'],
      ['chrome://foo', 'chrome://blah'],
    ].forEach((...args) => {
      const [href, baseURI] = Array.from(args[0]);
      it("should return the document's URL if it and the baseURI do not have an allowed scheme", () => {
        const doc = createDoc(href, baseURI);
        assert.equal(doc.uri(), href);
      });
    });

    it('returns the canonical URI if present', () => {
      const htmlDoc = document.implementation.createHTMLDocument();
      const canonicalLink = htmlDoc.createElement('link');
      canonicalLink.rel = 'canonical';
      canonicalLink.href = 'https://publisher.org/canonical';
      htmlDoc.head.appendChild(canonicalLink);

      const doc = createDoc(
        'https://publisher.org/not-canonical',
        null,
        htmlDoc
      );

      assert.equal(doc.uri(), canonicalLink.href);
    });
  });
});
