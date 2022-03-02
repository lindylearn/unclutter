/**
 * Checkers to test which polyfills are required by the current browser.
 *
 * This module executes in an environment without any polyfills loaded so it
 * needs to run in old browsers, down to IE 11.
 *
 * See gulpfile.js for details of how to add a new polyfill.
 */

/**
 * Return true if `obj` has all of the methods in `methods`.
 */
function hasMethods(obj, ...methods) {
  return methods.every(method => typeof obj[method] === 'function');
}

/**
 * Map of polyfill set name to function to test whether the current browser
 * needs that polyfill set.
 *
 * Each checker function returns `true` if the polyfill is required or `false`
 * if the browser has the functionality natively available.
 */
const needsPolyfill = {
  es2017: () => {
    return !hasMethods(Object, 'entries', 'values');
  },

  es2018: () => {
    return (
      typeof Promise !== 'function' || !hasMethods(Promise.prototype, 'finally')
    );
  },
};

/**
 * Return the subset of polyfill sets from `needed`  which are needed by the
 * current browser.
 */
export function requiredPolyfillSets(needed) {
  return needed.filter(set => {
    const checker = needsPolyfill[set];
    if (!checker) {
      throw new Error(`Unknown polyfill set "${set}"`);
    }
    return checker();
  });
}
