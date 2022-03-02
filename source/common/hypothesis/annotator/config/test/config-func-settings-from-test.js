import configFuncSettingsFrom from '../config-func-settings-from';

describe('annotator.config.configFuncSettingsFrom', () => {
  const sandbox = sinon.createSandbox();

  afterEach('reset the sandbox', () => {
    sandbox.restore();
  });

  context("when there's no window.hypothesisConfig() function", () => {
    it('returns {}', () => {
      const fakeWindow = {};

      assert.deepEqual(configFuncSettingsFrom(fakeWindow), {});
    });
  });

  context("when window.hypothesisConfig() isn't a function", () => {
    beforeEach('stub console.warn()', () => {
      sandbox.stub(console, 'warn');
    });

    function fakeWindow() {
      return { hypothesisConfig: 42 };
    }

    it('returns {}', () => {
      assert.deepEqual(configFuncSettingsFrom(fakeWindow()), {});
    });

    it('logs a warning', () => {
      configFuncSettingsFrom(fakeWindow());

      assert.calledOnce(console.warn);
      assert.isTrue(
        console.warn.firstCall.args[0].startsWith(
          'hypothesisConfig must be a function'
        )
      );
    });
  });

  context('when window.hypothesisConfig() is a function', () => {
    it('returns whatever window.hypothesisConfig() returns', () => {
      // It just blindly returns whatever hypothesisConfig() returns
      // (even if it's not an object).
      const fakeWindow = { hypothesisConfig: sinon.stub().returns(42) };

      assert.equal(configFuncSettingsFrom(fakeWindow), 42);
    });
  });
});
