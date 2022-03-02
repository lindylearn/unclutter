import immutable from '../immutable';

describe('immutable', () => {
  it('deeply freezes objects', () => {
    const obj = {
      plainValue: 'plain',
      objectValue: {
        leafValue: 'leaf',
      },
      arrayValue: [1],
    };

    const result = immutable(obj);

    assert.equal(result, obj);
    assert.isTrue(Object.isFrozen(obj));
    assert.isTrue(Object.isFrozen(obj.objectValue));
    assert.isTrue(Object.isFrozen(obj.arrayValue));
  });

  it('does nothing if object is already frozen', () => {
    const obj = { child: {} };

    assert.equal(immutable(obj), obj); // Freezes object and returns it.
    assert.equal(immutable(obj), obj); // Just returns input.
  });
});
