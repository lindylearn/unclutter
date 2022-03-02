import { normalizeURI } from '../url';

describe('annotator.util.url', () => {
  describe('normalizeURI', () => {
    it('resolves relative URLs against the provided base URI', () => {
      const base = 'http://example.com';
      assert.equal(normalizeURI('index.html', base), `${base}/index.html`);
    });

    it('resolves relative URLs against the document URI, if no base URI is provided', () => {
      // Strip filename from base URI.
      const base = document.baseURI.replace(/\/[^/]*$/, '');
      assert.equal(normalizeURI('foo.html'), `${base}/foo.html`);
    });

    it('does not modify absolute URIs', () => {
      const url = 'http://example.com/wibble';
      assert.equal(normalizeURI(url), url);
    });

    it('removes the fragment identifier', () => {
      const url = 'http://example.com/wibble#fragment';
      assert.equal(normalizeURI(url), 'http://example.com/wibble');
    });

    ['file:///Users/jane/article.pdf', 'doi:10.1234/4567'].forEach(url => {
      it('does not modify absolute non-HTTP/HTTPS URLs', () => {
        assert.equal(normalizeURI(url), url);
      });
    });
  });
});
