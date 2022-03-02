/**
 * Extract the protocol and hostname (ie. host without port) from the URL.
 *
 * We don't use the URL constructor here because IE and early versions of Edge
 * do not support it and this code runs early in the life of the app before any
 * polyfills can be loaded.
 */
function extractOrigin(url) {
  const match = url.match(/(https?):\/\/([^:/]+)/);
  if (!match) {
    return null;
  }
  return { protocol: match[1], hostname: match[2] };
}

function currentScriptOrigin(document_ = document) {
  const scriptEl = /** @type {HTMLScriptElement|null} */ (
    document_.currentScript
  );
  if (!scriptEl) {
    // Function was called outside of initial script execution.
    return null;
  }
  return extractOrigin(scriptEl.src);
}

/**
 * Replace references to `current_host` and `current_scheme` URL template
 * parameters with the corresponding elements of the current script URL.
 *
 * During local development, there are cases when the client/h needs to be accessed
 * from a device or VM that is not the system where the development server is
 * running. In that case, all references to `localhost` need to be replaced
 * with the IP/hostname of the dev server.
 *
 * @param {string} url
 * @param {Document} document_
 */
export default function processUrlTemplate(url, document_ = document) {
  if (url.indexOf('{') === -1) {
    // Not a template. This should always be the case in production.
    return url;
  }

  const origin = currentScriptOrigin(document_);

  if (origin) {
    url = url.replace('{current_host}', origin.hostname);
    url = url.replace('{current_scheme}', origin.protocol);
  } else {
    throw new Error(
      'Could not process URL template because script origin is unknown'
    );
  }

  return url;
}
