import { createShadowRoot } from '../shadow-root';

describe('annotator/util/shadow-root', () => {
  let applyFocusVisiblePolyfill;
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    applyFocusVisiblePolyfill = window.applyFocusVisiblePolyfill;
    window.applyFocusVisiblePolyfill = sinon.stub();
  });

  afterEach(() => {
    container.remove();
    window.applyFocusVisiblePolyfill = applyFocusVisiblePolyfill;
  });

  describe('createShadowRoot', () => {
    it('attaches a shadow root to the container', () => {
      const shadowRoot = createShadowRoot(container);

      assert.ok(shadowRoot);
      assert.equal(container.shadowRoot, shadowRoot);
    });

    it('does not attach a shadow root if Shadow DOM is unavailable', () => {
      container.attachShadow = null;
      const shadowRoot = createShadowRoot(container);

      assert.equal(shadowRoot, container);
    });

    it('injects stylesheets into the shadow root', () => {
      createShadowRoot(container);

      const linkEl = container.shadowRoot.querySelector('link[rel=stylesheet]');
      assert.ok(linkEl);
      assert.include(linkEl.href, 'annotator.css');
    });

    it('applies the applyFocusVisiblePolyfill if exists', () => {
      const shadowRoot = createShadowRoot(container);

      assert.calledWith(window.applyFocusVisiblePolyfill, shadowRoot);
    });

    it('does not inject stylesheets into the shadow root if style is not found', () => {
      const link = document.querySelector(
        'link[rel="stylesheet"][href*="/build/styles/annotator.css"]'
      );
      // Removing the `rel` attribute is enough for the URL to not be found
      link.removeAttribute('rel');

      createShadowRoot(container);

      const linkEl = container.shadowRoot.querySelector('link[rel=stylesheet]');
      assert.isNull(linkEl);
      link.setAttribute('rel', 'stylesheet');
    });

    it('stops propagation of "mouseup" events', () => {
      const onClick = sinon.stub();
      container.addEventListener('click', onClick);

      const shadowRoot = createShadowRoot(container);
      const innerElement = document.createElement('div');
      shadowRoot.appendChild(innerElement);
      innerElement.dispatchEvent(
        // `composed` property is necessary to bubble up the event out of the shadow DOM.
        // browser generated events, have this property set to true.
        new Event('mouseup', { bubbles: true, composed: true })
      );

      assert.notCalled(onClick);
    });

    it('stops propagation of "mousedown" events', () => {
      const onClick = sinon.stub();
      container.addEventListener('mousedown', onClick);

      const shadowRoot = createShadowRoot(container);
      const innerElement = document.createElement('div');
      shadowRoot.appendChild(innerElement);
      innerElement.dispatchEvent(
        // `composed` property is necessary to bubble up the event out of the shadow DOM.
        // browser generated events, have this property set to true.
        new Event('mousedown', { bubbles: true, composed: true })
      );

      assert.notCalled(onClick);
    });

    it('stops propagation of "touchstart" events', () => {
      const onTouch = sinon.stub();
      container.addEventListener('touchstart', onTouch);

      const shadowRoot = createShadowRoot(container);
      const innerElement = document.createElement('div');
      shadowRoot.appendChild(innerElement);
      // `composed` property is necessary to bubble up the event out of the shadow DOM.
      // browser generated events, have this property set to true.
      innerElement.dispatchEvent(
        new Event('touchstart', { bubbles: true, composed: true })
      );

      assert.notCalled(onTouch);
    });
  });
});
