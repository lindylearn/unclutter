import disableOpenerForExternalLinks from '../disable-opener-for-external-links';

describe('sidebar.util.disable-opener-for-external-links', () => {
  let containerEl;
  let linkEl;

  beforeEach(() => {
    containerEl = document.createElement('div');
    linkEl = document.createElement('a');
    containerEl.appendChild(linkEl);
    document.body.appendChild(containerEl);
  });

  afterEach(() => {
    containerEl.remove();
  });

  function clickLink() {
    linkEl.dispatchEvent(
      new Event('click', {
        bubbles: true,
        cancelable: true,
      })
    );
  }

  it('disables opener for external links', () => {
    linkEl.target = '_blank';

    disableOpenerForExternalLinks(containerEl);
    clickLink();

    assert.equal(linkEl.rel, 'noopener');
  });

  it('does not disable opener for internal links', () => {
    disableOpenerForExternalLinks(containerEl);
    clickLink();
    assert.equal(linkEl.rel, '');
  });
});
