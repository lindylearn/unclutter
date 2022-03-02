import warnOnce from '../warn-once';

describe('warnOnce', () => {
  beforeEach(() => {
    sinon.stub(console, 'warn');
    warnOnce.reset();
  });

  afterEach(() => {
    console.warn.restore();
  });

  it('outputs a warning only the first time a given string is passed', () => {
    warnOnce('something is fishy');
    assert.calledWith(console.warn, 'something is fishy');

    console.warn.reset();
    warnOnce('something is fishy');
    assert.notCalled(console.warn);

    warnOnce('something else is wrong');
    assert.calledWith(console.warn, 'something else is wrong');
  });

  it('supports multiple arguments', () => {
    warnOnce('foo', 'bar', 'baz');
    assert.calledWith(console.warn, 'foo', 'bar', 'baz');
  });

  it('supports non-string arguments', () => {
    const obj = {};
    warnOnce(1, {}, false);
    assert.calledWith(console.warn, 1, obj, false);
  });
});
