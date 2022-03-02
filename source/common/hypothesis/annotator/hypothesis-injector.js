import { FrameObserver } from './frame-observer';

/**
 * @typedef {import('../shared/bridge').Bridge} Bridge
 * @typedef {import('../types/annotator').Destroyable} Destroyable
 */

/**
 * HypothesisInjector has logic for injecting Hypothesis client into iframes that
 * are added to the page if (1) they have the `enable-annotation` attribute set
 * and (2) are same-origin with the current document.
 *
 * @implements Destroyable
 */
export class HypothesisInjector {
  /**
   * @param {Element} element - root of the DOM subtree to watch for the
   *   addition and removal of annotatable iframes
   * @param {Bridge} bridge - Channel for communicating with the sidebar
   * @param {Record<string, any>} config - Annotator configuration that is
   *   injected, along with the Hypothesis client, into the child iframes
   */
  constructor(element, bridge, config) {
    this._bridge = bridge;
    this._config = config;
    /** @type {Map<HTMLIFrameElement, string>} */
    this._frameIdentifiers = new Map();
    this._frameObserver = new FrameObserver(
      element,
      frame => this._addHypothesis(frame),
      frame => this._removeHypothesis(frame)
    );
  }

  /**
   * Disables the injection of the Hypothesis client into child iframes.
   */
  destroy() {
    this._frameObserver.disconnect();
  }

  /**
   * Inject Hypothesis client into a newly-discovered iframe.
   *
   * IMPORTANT: This method requires that the iframe is "accessible"
   * (frame.contentDocument|contentWindow is not null) and "ready" (DOM content
   * has been loaded and parsed) before the method is called.
   *
   * @param {HTMLIFrameElement} frame
   */
  _addHypothesis(frame) {
    if (hasHypothesis(frame)) {
      return;
    }

    // Generate a random string to use as a frame ID. The format is not important.
    const subFrameIdentifier = Math.random().toString().replace(/\D/g, '');
    this._frameIdentifiers.set(frame, subFrameIdentifier);
    const injectedConfig = {
      ...this._config,
      subFrameIdentifier,
    };

    const { clientUrl } = this._config;
    injectHypothesis(frame, clientUrl, injectedConfig);
  }

  /**
   * @param {HTMLIFrameElement} frame
   */
  _removeHypothesis(frame) {
    this._bridge.call('destroyFrame', this._frameIdentifiers.get(frame));
    this._frameIdentifiers.delete(frame);
  }
}

/**
 * Check if the Hypothesis client has already been injected into an iframe
 *
 * @param {HTMLIFrameElement} iframe
 */
function hasHypothesis(iframe) {
  const iframeWindow = /** @type {Window} */ (iframe.contentWindow);
  return '__hypothesis' in iframeWindow;
}

/**
 * Inject the client's boot script into the iframe. The iframe must be from the
 * same origin as the current window.
 *
 * @param {HTMLIFrameElement} iframe
 * @param {string} scriptSrc
 * @param {Record<string, any>} config
 */
function injectHypothesis(iframe, scriptSrc, config) {
  const configElement = document.createElement('script');
  configElement.className = 'js-hypothesis-config';
  configElement.type = 'application/json';
  configElement.innerText = JSON.stringify(config);

  const bootScript = document.createElement('script');
  bootScript.async = true;
  bootScript.src = scriptSrc;

  const iframeDocument = /** @type {Document} */ (iframe.contentDocument);
  iframeDocument.body.appendChild(configElement);
  iframeDocument.body.appendChild(bootScript);
}
