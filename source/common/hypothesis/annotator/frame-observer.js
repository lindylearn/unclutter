import debounce from 'lodash.debounce';

export const DEBOUNCE_WAIT = 40;

/** @typedef {(frame: HTMLIFrameElement) => void} FrameCallback */

/**
 * FrameObserver detects iframes added and deleted from the document.
 *
 * To enable annotation, an iframe must be opted-in by adding the
 * `enable-annotation` attribute.
 *
 * We require the `enable-annotation` attribute to avoid the overhead of loading
 * the client into frames which are not useful to annotate. See
 * https://github.com/hypothesis/client/issues/530
 */
export class FrameObserver {
  /**
   * @param {Element} element - root of the DOM subtree to watch for the addition
   *   and removal of annotatable iframes
   * @param {FrameCallback} onFrameAdded - callback fired when an annotatable iframe is added
   * @param {FrameCallback} onFrameRemoved - callback triggered when the annotatable iframe is removed
   */
  constructor(element, onFrameAdded, onFrameRemoved) {
    this._element = element;
    this._onFrameAdded = onFrameAdded;
    this._onFrameRemoved = onFrameRemoved;
    /** @type {Set<HTMLIFrameElement>} */
    this._handledFrames = new Set();
    this._isDisconnected = false;

    this._mutationObserver = new MutationObserver(
      debounce(() => {
        this._discoverFrames();
      }, DEBOUNCE_WAIT)
    );
    this._discoverFrames();
    this._mutationObserver.observe(this._element, {
      childList: true,
      subtree: true,
      attributeFilter: ['enable-annotation'],
    });
  }

  disconnect() {
    this._isDisconnected = true;
    this._mutationObserver.disconnect();
  }

  /**
   * @param {HTMLIFrameElement} frame
   */
  async _addFrame(frame) {
    this._handledFrames.add(frame);
    if (isAccessible(frame)) {
      await onDocumentReady(frame);
      if (this._isDisconnected) {
        return;
      }
      const frameWindow = /** @type {Window} */ (frame.contentWindow);
      frameWindow.addEventListener('unload', () => {
        this._removeFrame(frame);
      });
      this._onFrameAdded(frame);
    } else {
      // Could warn here that frame was not cross origin accessible
    }
  }

  /**
   * @param {HTMLIFrameElement} frame
   */
  _removeFrame(frame) {
    this._handledFrames.delete(frame);
    this._onFrameRemoved(frame);
  }

  _discoverFrames() {
    const frames = new Set(
      /** @type {NodeListOf<HTMLIFrameElement> } */ (
        this._element.querySelectorAll('iframe[enable-annotation]')
      )
    );

    for (let frame of frames) {
      if (!this._handledFrames.has(frame)) {
        this._addFrame(frame);
      }
    }

    for (let frame of this._handledFrames) {
      if (!frames.has(frame)) {
        this._removeFrame(frame);
      }
    }
  }
}

/**
 * Check if we can access this iframe's document
 *
 * @param {HTMLIFrameElement} iframe
 */
function isAccessible(iframe) {
  try {
    return !!iframe.contentDocument;
  } catch (e) {
    return false;
  }
}

/**
 * Resolves a Promise when the iframe's DOM is ready (loaded and parsed)
 *
 * @param {HTMLIFrameElement} iframe
 * @return {Promise<void>}
 */
export function onDocumentReady(iframe) {
  return new Promise(resolve => {
    const iframeDocument = /** @type {Document} */ (iframe.contentDocument);
    if (iframeDocument.readyState === 'loading') {
      iframeDocument.addEventListener('DOMContentLoaded', () => {
        resolve();
      });
    } else {
      resolve();
    }
  });
}
