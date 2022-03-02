import { run } from 'axe-core';
import { ReactWrapper, mount } from 'enzyme';
import { isValidElement } from 'preact';

/**
 * @typedef {Scenario}
 * @prop {string} [name] -
 *   A descriptive name for the scenario. Defaults to "default" if not specified.
 * @prop {() => import('preact').VNode|ReactWrapper} content -
 *   A function that returns the rendered output to test or an Enzyme wrapper
 *   created using Enzyme's `mount` function.
 * @prop {string} [backgroundColor] -
 *   Background color onto which to render the element. This can affect the
 *   result of color contrast tests. Defaults to white.
 */

async function testScenario(
  elementOrWrapper,
  { backgroundColor = 'white' } = {}
) {
  const container = document.createElement('div');
  container.style.backgroundColor = backgroundColor;
  document.body.appendChild(container);

  let wrapper;
  if (elementOrWrapper instanceof ReactWrapper) {
    wrapper = elementOrWrapper;
    container.appendChild(elementOrWrapper.getDOMNode());
  } else {
    wrapper = mount(elementOrWrapper, { attachTo: container });
  }

  const results = await run(container, {
    // Run checks that correspond to the WCAG AA and Section 508 compliance
    // criteria. These are the standards that we have committed to customers to
    // meet.
    runOnly: { type: 'tag', values: ['section508', 'wcag2a', 'wcag2aa'] },

    // Only check for definite failures. The other possible non-pass outcomes for a
    // given check are "incomplete" (couldn't determine status automatically)
    // or "inapplicable" (no relevant HTML elements found).
    resultTypes: ['violations'],
  });
  wrapper.unmount();
  container.remove();

  return results.violations;
}

/**
 * Generate an accessibility test function for a component.
 *
 * The returned function should be passed as the callback argument to an `it`
 * call in a Mocha test (eg. `it("should pass a11y checks", checkAccessibility(...))`).
 *
 * An accessibility test consists of an array of scenarios describing typical
 * states of the component.
 *
 * @param {Scenario|Scenario[]} scenarios
 * @return {() => Promise}
 */
export function checkAccessibility(scenarios) {
  if (!Array.isArray(scenarios)) {
    scenarios = [scenarios];
  }

  return async () => {
    for (let { name = 'default', content, ...config } of scenarios) {
      if (typeof content !== 'function') {
        throw new Error(
          `"content" key for accessibility scenario "${name}" should be a function but is a ${typeof content}`
        );
      }

      const elementOrWrapper = content();

      if (
        !(elementOrWrapper instanceof ReactWrapper) &&
        !isValidElement(elementOrWrapper)
      ) {
        throw new Error(
          `Expected "content" function for scenario "${name}" to return a Preact element or an Enzyme wrapper`
        );
      }

      const violations = await testScenario(elementOrWrapper, config);
      assert.deepEqual(
        violations,
        [],
        `Scenario "${name}" has accessibility violations`
      );
    }
  };
}
