import memoize from '../memoize';

describe('memoize', () => {
  let count = 0;
  let memoized;

  function square(arg) {
    ++count;
    return arg * arg;
  }

  beforeEach(() => {
    count = 0;
    memoized = memoize(square);
  });

  it('computes the result of the function', () => {
    assert.equal(memoized(12), 144);
  });

  it('does not recompute if the input is unchanged', () => {
    memoized(42);
    memoized(42);
    assert.equal(count, 1);
  });

  it('recomputes if the input changes', () => {
    memoized(42);
    memoized(39);
    assert.equal(count, 2);
  });
});
