import { pageNumberOptions } from '../pagination';

describe('sidebar/util/pagination', () => {
  describe('pageNumberOptions', () => {
    [
      { args: [1, 10, 5], expected: [1, 2, 3, 4, null, 10] },
      { args: [3, 10, 5], expected: [1, 2, 3, 4, null, 10] },
      { args: [6, 10, 5], expected: [1, null, 5, 6, 7, null, 10] },
      { args: [9, 10, 5], expected: [1, null, 7, 8, 9, 10] },
      { args: [2, 3, 5], expected: [1, 2, 3] },
      { args: [3, 10, 7], expected: [1, 2, 3, 4, 5, 6, null, 10] },
      { args: [1, 1, 5], expected: [] },
    ].forEach(testCase => {
      it('should produce expected available page numbers', () => {
        assert.deepEqual(
          pageNumberOptions(...testCase.args),
          testCase.expected
        );
      });
    });
  });
});
