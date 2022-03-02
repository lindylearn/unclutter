/**
 * Run a series of representative feature tests to see if the browser is new
 * enough to support Hypothesis.
 *
 * We use feature tests to try to avoid false negatives, accepting some risk of
 * false positives due to the host page having loaded polyfills for APIs in order
 * to support older browsers.
 *
 * @return {boolean}
 */
export function isBrowserSupported() {
  const checks = [
    // ES APIs.
    () => Promise.resolve(),
    () => new Map(),

    // DOM API checks for frequently-used APIs.
    () => new URL(document.location.href), // URL constructor.
    () => new Request('https://hypothes.is'), // Part of the `fetch` API.
    () => Element.prototype.prepend.name,

    // DOM API checks for less frequently-used APIs.
    // These are less likely to have been polyfilled by the host page.
    () => {
      document.evaluate(
        '/html/body',
        document,

        // These arguments are optional in the spec but required in Edge Legacy.
        null /* namespaceResolver */,
        XPathResult.ANY_TYPE,
        null /* result */
      );
    },
  ];

  try {
    checks.forEach(check => check());
    return true;
  } catch (err) {
    return false;
  }
}
