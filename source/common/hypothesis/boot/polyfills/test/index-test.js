import { requiredPolyfillSets } from '../';

function stubOut(obj, property, replacement = undefined) {
  const saved = obj[property];

  // We don't use `delete obj[property]` here because that isn't allowed for
  // some native APIs in some browsers.
  obj[property] = replacement;

  return () => {
    obj[property] = saved;
  };
}

describe('boot/polyfills/index', () => {
  describe('requiredPolyfillSets', () => {
    let undoStub;

    afterEach(() => {
      if (undoStub) {
        undoStub();
        undoStub = null;
      }
    });

    [
      {
        set: 'es2017',
        providesMethod: [Object, 'entries'],
      },
      {
        set: 'es2018',
        providesMethod: [Promise.prototype, 'finally'],
      },
      {
        set: 'es2018',
        providesMethod: [window, 'Promise'],
      },
    ].forEach(({ set, providesMethod }) => {
      it(`includes "${set}" if required`, () => {
        const [obj, method, replacement] = providesMethod;
        undoStub = stubOut(obj, method, replacement);
        const sets = requiredPolyfillSets([set]);
        assert.deepEqual(sets, [set]);
      });

      it(`does not include "${set}" if not required`, () => {
        assert.deepEqual(requiredPolyfillSets([set]), []);
      });
    });
  });
});
