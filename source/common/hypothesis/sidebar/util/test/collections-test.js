import * as collectionsUtil from '../collections';

describe('sidebar/util/collections', () => {
  describe('countIf', () => {
    it('should return a count of array elements satisfying the predicate', () => {
      const predicate = val => val === 1;
      const arr = [1, 1, 1, 0, 0, 0, 1, 1, undefined, 5, '4', '1'];
      assert.equal(collectionsUtil.countIf(arr, predicate), 5);
    });
  });

  describe('toTrueMap', () => {
    it('should return an object with all properties set to `true`', () => {
      const myArr = ['hi', 'there', 'i', 'like', 'blue', 'things'];
      assert.deepEqual(collectionsUtil.toTrueMap(myArr), {
        hi: true,
        there: true,
        i: true,
        like: true,
        blue: true,
        things: true,
      });
    });
  });

  describe('trueKeys', () => {
    it('should return an array of keys that correspond to `true` properties', () => {
      const myObj = {
        yes: true,
        no: false,
        1: true,
        0: false,
        hooray: true,
      };
      assert.sameMembers(collectionsUtil.trueKeys(myObj), [
        'yes',
        '1',
        'hooray',
      ]);
    });
  });
});
