/**
 * Wait for a condition to evaluate to a truthy value.
 *
 * @param {() => any} condition - Function that returns a truthy value when some condition is met
 * @param {number} timeout - Max delay in milliseconds to wait
 * @param {string} what - Description of condition that is being waited for
 * @return {Promise<any>} - Result of the `condition` function
 */
export async function waitFor(
  condition,
  timeout = 10,
  what = condition.toString()
) {
  const result = condition();
  if (result) {
    return result;
  }

  const start = Date.now();

  return new Promise((resolve, reject) => {
    const timer = setInterval(() => {
      const result = condition();
      if (result) {
        clearTimeout(timer);
        resolve(result);
      }
      if (Date.now() - start > timeout) {
        clearTimeout(timer);
        reject(new Error(`waitFor(${what}) failed after ${timeout} ms`));
      }
    });
  });
}
