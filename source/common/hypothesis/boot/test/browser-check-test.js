import { isBrowserSupported } from '../browser-check';

describe('isBrowserSupported', () => {
  it('returns true in a modern browser', () => {
    assert.isTrue(isBrowserSupported());
  });

  it('returns false if a check fails', () => {
    // Override `Document.prototype.evaluate`.
    document.evaluate = null;

    assert.isFalse(isBrowserSupported());

    // Remove override.
    delete document.evaluate;
  });
});
