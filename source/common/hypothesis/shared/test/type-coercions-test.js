import { toBoolean, toInteger, toObject, toString } from '../type-coercions';

describe('shared/type-coercions', () => {
  describe('toBoolean', () => {
    [
      {
        value: true,
        result: true,
      },
      {
        value: 'true',
        result: true,
      },
      {
        value: 'any',
        result: true,
      },
      {
        value: 'false',
        result: false,
      },
      {
        value: ' false',
        result: false,
      },
      {
        value: 'False',
        result: false,
      },
      {
        value: 'FALSE',
        result: false,
      },
      {
        value: '',
        result: false,
      },
      {
        value: '1',
        result: true,
      },
      {
        value: '0',
        result: false,
      },
      {
        value: 1,
        result: true,
      },
      {
        value: null,
        result: false,
      },
      {
        value: undefined,
        result: false,
      },
    ].forEach(test => {
      it('coerces the values appropriately', () => {
        assert.equal(toBoolean(test.value), test.result);
      });
    });
  });

  describe('toInteger', () => {
    [
      {
        value: '1',
        result: 1,
      },
      {
        value: '0',
        result: 0,
      },
      {
        value: 1,
        result: 1,
      },
      {
        value: 1.1,
        result: 1,
      },
      {
        value: 'a',
        result: NaN,
      },
    ].forEach(test => {
      it('coerces the values appropriately', () => {
        assert.deepEqual(toInteger(test.value), test.result);
      });
    });
  });

  describe('toObject', () => {
    [
      {
        value: { a: 'a', b: { c: ['c'] } },
        result: { a: 'a', b: { c: ['c'] } },
      },
      {
        value: 1,
        result: {},
      },
      {
        value: null,
        result: {},
      },
      {
        value: undefined,
        result: {},
      },
    ].forEach(test => {
      it('coerces the values appropriately', () => {
        assert.deepEqual(toObject(test.value), test.result);
      });
    });
  });

  describe('toString', () => {
    [
      {
        value: 'a',
        result: 'a',
      },
      {
        value: 1,
        result: '1',
      },
      {
        value: null,
        result: '',
      },
      {
        value: undefined,
        result: '',
      },
      {
        value: {
          // In a rare case where its an object with custom
          // toString value that is not a function.
          toString: false,
        },
        result: '',
      },
    ].forEach(test => {
      it('coerces the values appropriately', () => {
        assert.equal(toString(test.value), test.result);
      });
    });
  });
});
