import { urlFromLinkTag } from '../url-from-link-tag';

describe('url-from-link-tag', () => {
  function appendLink(href, rel, type) {
    const link = document.createElement('link');
    link.type = 'application/annotator+' + type;
    link.rel = rel;
    if (href) {
      link.href = href;
    }
    document.head.appendChild(link);
    return link;
  }

  it('returns the url from the matching link tag of type "html"', () => {
    const link = appendLink('http://example.com/app.html', 'sidebar', 'html');
    assert.equal(
      urlFromLinkTag(window, 'sidebar', 'html'),
      'http://example.com/app.html'
    );
    link.remove();
  });

  it('returns the url from the matching link tag of type javascript', () => {
    const link = appendLink(
      'http://example.com/app.html',
      'hypothesis-client',
      'javascript'
    );
    assert.equal(
      urlFromLinkTag(window, 'hypothesis-client', 'javascript'),
      'http://example.com/app.html'
    );
    link.remove();
  });

  context('when there are multiple matching links', () => {
    it('returns the href from the first matching link', () => {
      const link1 = appendLink('http://example.com/app1', 'notebook', 'html');
      const link2 = appendLink('http://example.com/app2', 'notebook', 'html');
      assert.equal(
        urlFromLinkTag(window, 'notebook', 'html'),
        'http://example.com/app1'
      );
      link1.remove();
      link2.remove();
    });
  });

  context('missing or invalid link tag', () => {
    ['html', 'javascript'].forEach(type => {
      it('throws an error if link tag is missing', () => {
        assert.throws(() => {
          urlFromLinkTag(window, 'fakeApp', type);
        }, `No application/annotator+${type} (rel="fakeApp") link in the document`);
      });

      it('throws an error if href is missing in link tag', () => {
        const link = appendLink(null, 'fakeApp', type);
        assert.throws(() => {
          urlFromLinkTag(window, 'fakeApp', type);
        }, `application/annotator+${type} (rel="fakeApp") link has no href`);
        link.remove();
      });
    });
  });
});
