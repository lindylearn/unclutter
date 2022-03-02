/**
 * Add-on for async exception testing.
 *
 * The `promiseResult` is awaited, and then upon any exception, the resulting
 * error message is matched against the `errorMessage` string or regex. This
 * method throws an error if `promiseResult` does not throw an error or will
 * throw an assertion error if the caught error message differs from the
 * `errorMessage` parameter.
 *
 * e.g. await rejects(someAsyncFunction(), /expected error/g);
 *
 * @param {Promise} promiseResult - The returned promise a function to test
 * @param {RegEx|String} errorMessage - A string or regex that matches the error
 * which is expected to be thrown.
 */

const rejects = async (promiseResult, errorMessage) => {
  try {
    await promiseResult;
    const error = new Error();
    error.name = 'ErrorNotCaught';
    throw error;
  } catch (e) {
    if (e.name === 'ErrorNotCaught') {
      throw new Error(
        'Expected to catch the rejected promise but it was not thrown'
      );
    }
    if (errorMessage instanceof RegExp) {
      assert.isTrue(errorMessage.test(e.message));
    } else {
      assert.equal(e.message, errorMessage);
    }
  }
};

/**
 * Patches the assert object with additional custom helper methods
 * defined in this module.
 *
 * @param {Object} assert - global assertion object.
 */
export function patch(assert) {
  assert.rejects = rejects;
}
