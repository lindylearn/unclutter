import { parseJsonConfig } from '../parse-json-config';

describe('#parseJsonConfig', () => {
  const sandbox = sinon.createSandbox();

  function appendJSHypothesisConfig(document_, jsonString) {
    const el = document_.createElement('script');
    el.type = 'application/json';
    el.textContent = jsonString;
    el.classList.add('js-hypothesis-config');
    el.classList.add('js-settings-test');
    document_.body.appendChild(el);
  }

  afterEach(() => {
    // Remove test config scripts.
    const elements = document.querySelectorAll('.js-settings-test');
    for (let i = 0; i < elements.length; i++) {
      elements[i].remove();
    }

    sandbox.restore();
  });

  context('when there are no JSON scripts', () => {
    it('returns {}', () => {
      assert.deepEqual(parseJsonConfig(document), {});
    });
  });

  context("when there's JSON scripts with no top-level objects", () => {
    beforeEach('add JSON scripts with no top-level objects', () => {
      appendJSHypothesisConfig(document, 'null');
      appendJSHypothesisConfig(document, '23');
      appendJSHypothesisConfig(document, 'true');
    });

    it('ignores them', () => {
      assert.deepEqual(parseJsonConfig(document), {});
    });
  });

  context("when there's a JSON script with a top-level array", () => {
    beforeEach('add a JSON script containing a top-level array', () => {
      appendJSHypothesisConfig(document, '["a", "b", "c"]');
    });

    it('returns the array, parsed into an object', () => {
      assert.deepEqual(parseJsonConfig(document), { 0: 'a', 1: 'b', 2: 'c' });
    });
  });

  context("when there's a JSON script with a top-level string", () => {
    beforeEach('add a JSON script with a top-level string', () => {
      appendJSHypothesisConfig(document, '"hi"');
    });

    it('returns the string, parsed into an object', () => {
      assert.deepEqual(parseJsonConfig(document), { 0: 'h', 1: 'i' });
    });
  });

  context("when there's a JSON script containing invalid JSON", () => {
    beforeEach('stub console.warn()', () => {
      sandbox.stub(console, 'warn');
    });

    beforeEach('add a JSON script containing invalid JSON', () => {
      appendJSHypothesisConfig(document, 'this is not valid json');
    });

    it('logs a warning', () => {
      parseJsonConfig(document);

      assert.called(console.warn);
    });

    it('returns {}', () => {
      assert.deepEqual(parseJsonConfig(document), {});
    });

    it('still returns settings from other JSON scripts', () => {
      appendJSHypothesisConfig(document, '{"foo": "FOO", "bar": "BAR"}');

      assert.deepEqual(parseJsonConfig(document), { foo: 'FOO', bar: 'BAR' });
    });
  });

  context("when there's a JSON script with an empty object", () => {
    beforeEach('add a JSON script containing an empty object', () => {
      appendJSHypothesisConfig(document, '{}');
    });

    it('ignores it', () => {
      assert.deepEqual(parseJsonConfig(document), {});
    });
  });

  context("when there's a JSON script containing some settings", () => {
    beforeEach('add a JSON script containing some settings', () => {
      appendJSHypothesisConfig(document, '{"foo": "FOO", "bar": "BAR"}');
    });

    it('returns the settings', () => {
      assert.deepEqual(parseJsonConfig(document), { foo: 'FOO', bar: 'BAR' });
    });
  });

  context('when there are JSON scripts with different settings', () => {
    beforeEach('add some JSON scripts with different settings', () => {
      appendJSHypothesisConfig(document, '{"foo": "FOO"}');
      appendJSHypothesisConfig(document, '{"bar": "BAR"}');
      appendJSHypothesisConfig(document, '{"gar": "GAR"}');
    });

    it('merges them all into one returned object', () => {
      assert.deepEqual(parseJsonConfig(document), {
        foo: 'FOO',
        bar: 'BAR',
        gar: 'GAR',
      });
    });
  });

  context('when multiple JSON scripts contain the same setting', () => {
    beforeEach('add some JSON scripts with different settings', () => {
      appendJSHypothesisConfig(document, '{"foo": "first"}');
      appendJSHypothesisConfig(document, '{"foo": "second"}');
      appendJSHypothesisConfig(document, '{"foo": "third"}');
    });

    specify(
      'settings from later in the page override ones from earlier',
      () => {
        assert.equal(parseJsonConfig(document).foo, 'third');
      }
    );
  });
});
