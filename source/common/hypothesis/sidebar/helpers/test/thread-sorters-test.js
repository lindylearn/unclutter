import { sorters, $imports } from '../thread-sorters';

describe('sidebar/util/thread-sorters', () => {
  let fakeRootAnnotations;
  let fakeLocation;

  beforeEach(() => {
    // The thread argument passed to `Newest` or `Oldest` sorting functions
    // gets wrapped with an additional Array by `*RootAnnotationDate` before
    // being passed on to `rootAnnotations`. This unwraps that extra array
    // and returns the original first argument to `*RootAnnotationDate`
    fakeRootAnnotations = sinon.stub().callsFake(threads => threads[0]);
    fakeLocation = sinon.stub().callsFake(annotation => annotation.location);

    $imports.$mock({
      './annotation-metadata': { location: fakeLocation },
      './thread': { rootAnnotations: fakeRootAnnotations },
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  describe('sorting by newest annotation thread first', () => {
    [
      {
        a: [{ created: 40 }, { created: 5 }],
        b: [{ created: 20 }, { created: 3 }],
        expected: -1,
      },
      {
        a: [{ created: 20 }, { created: 3 }],
        b: [{ created: 20 }, { created: 3 }],
        expected: 0,
      },
      {
        a: [{ created: 20 }, { created: 3 }],
        b: [{ created: 40 }, { created: 5 }],
        expected: 1,
      },
    ].forEach(testCase => {
      it('sorts by newest created root annotation', () => {
        // Disable eslint: `sorters` properties start with capital letters
        // to match their displayed sort option values
        /* eslint-disable-next-line new-cap */
        assert.equal(sorters.Newest(testCase.a, testCase.b), testCase.expected);
      });
    });
  });

  describe('sorting by oldest annotation thread first', () => {
    [
      {
        a: [{ created: 20 }, { created: 5 }],
        b: [{ created: 40 }, { created: 3 }],
        expected: 1,
      },
      {
        a: [{ created: 20 }, { created: 3 }],
        b: [{ created: 20 }, { created: 3 }],
        expected: 0,
      },
      {
        a: [{ created: 40 }, { created: 3 }],
        b: [{ created: 20 }, { created: 5 }],
        expected: -1,
      },
    ].forEach(testCase => {
      it('sorts by oldest created root annotation', () => {
        // Disable eslint: `sorters` properties start with capital letters
        // to match their displayed sort option values
        /* eslint-disable-next-line new-cap */
        assert.equal(sorters.Oldest(testCase.a, testCase.b), testCase.expected);
      });
    });
  });

  describe('sorting by document location', () => {
    [
      {
        a: { annotation: { location: 5 } },
        b: { annotation: { location: 10 } },
        expected: -1,
      },
      {
        a: { annotation: { location: 10 } },
        b: { annotation: { location: 10 } },
        expected: 0,
      },
      {
        a: { annotation: { location: 10 } },
        b: { annotation: { location: 5 } },
        expected: 1,
      },
      {
        a: {},
        b: { annotation: { location: 5 } },
        expected: -1,
      },
      {
        a: {},
        b: {},
        expected: 0,
      },
      {
        a: { annotation: { location: 10 } },
        b: {},
        expected: 1,
      },
    ].forEach(testCase => {
      it('sorts by annotation location', () => {
        assert.equal(
          // Disable eslint: `sorters` properties start with capital letters
          // to match their displayed sort option values
          /* eslint-disable-next-line new-cap */
          sorters.Location(testCase.a, testCase.b),
          testCase.expected
        );
      });
    });
  });
});
