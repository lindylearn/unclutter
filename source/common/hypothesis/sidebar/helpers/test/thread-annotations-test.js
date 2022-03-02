import * as annotationFixtures from '../../test/annotation-fixtures';

import threadAnnotations from '../thread-annotations';
import { sorters } from '../thread-sorters';
import { $imports } from '../thread-annotations';
import immutable from '../../util/immutable';

const fixtures = immutable({
  emptyThread: {
    annotation: undefined,
    children: [],
  },
  nonEmptyDraft: {
    text: 'Some text',
    tags: [],
    isPrivate: false,
  },
});

describe('sidebar/helpers/thread-annotations', () => {
  let fakeBuildThread;
  let fakeFilterAnnotations;
  let fakeSearchFilter;
  let fakeThreadState;

  beforeEach(() => {
    fakeThreadState = {
      annotations: [],
      route: 'sidebar',
      selection: {
        expanded: {},
        forcedVisible: [],
        filters: {},
        filterQuery: null,
        selected: [],
        sortKey: 'Location',
        selectedTab: 'annotation',
      },
    };

    fakeBuildThread = sinon.stub().returns(fixtures.emptyThread);
    fakeFilterAnnotations = sinon.stub();
    fakeSearchFilter = {
      generateFacetedFilter: sinon.stub(),
    };

    $imports.$mock({
      './build-thread': fakeBuildThread,
      '../util/search-filter': fakeSearchFilter,
      './view-filter': fakeFilterAnnotations,
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  describe('threadAnnotations', () => {
    it('returns the result of buildThread', () => {
      assert.equal(threadAnnotations(fakeThreadState), fixtures.emptyThread);
    });

    it('memoizes on `threadState`', () => {
      fakeBuildThread.onCall(0).returns({ brisket: 'fingers' });
      fakeBuildThread.onCall(1).returns({ brisket: 'bananas' });

      const thread1 = threadAnnotations(fakeThreadState);
      const thread2 = threadAnnotations(fakeThreadState);

      assert.calledOnce(fakeBuildThread);
      assert.strictEqual(thread1, thread2);

      fakeThreadState = { ...fakeThreadState };

      const thread3 = threadAnnotations(fakeThreadState);

      assert.calledTwice(fakeBuildThread);
      assert.notStrictEqual(thread2, thread3);
    });

    it('passes annotations to buildThread', () => {
      const annotation = annotationFixtures.defaultAnnotation();
      fakeThreadState.annotations = [annotation];

      threadAnnotations(fakeThreadState);
      assert.calledWith(fakeBuildThread, sinon.match([annotation]));
    });

    it('passes on annotation states to buildThread as options', () => {
      threadAnnotations(fakeThreadState);

      assert.calledWith(
        fakeBuildThread,
        [],
        sinon.match({
          expanded: fakeThreadState.selection.expanded,
          forcedVisible: fakeThreadState.selection.forcedVisible,
          selected: fakeThreadState.selection.selected,
        })
      );
    });

    describe('when sort order changes', () => {
      ['Location', 'Oldest', 'Newest'].forEach(testCase => {
        it(`uses the appropriate sorting function when sorting by ${testCase}`, () => {
          fakeThreadState.selection.sortKey = testCase;

          threadAnnotations(fakeThreadState);

          // The sort compare fn passed to `buildThread`
          const sortCompareFn = fakeBuildThread.args[0][1].sortCompareFn;
          assert.equal(sortCompareFn, sorters[testCase]);
        });
      });
    });

    describe('annotation and thread filtering', () => {
      context('sidebar route', () => {
        ['note', 'annotation', 'orphan'].forEach(selectedTab => {
          it(`should filter the thread for the tab '${selectedTab}'`, () => {
            const annotations = {
              ['annotation']: {
                ...annotationFixtures.defaultAnnotation(),
                $orphan: false,
              },
              ['note']: annotationFixtures.oldPageNote(),
              ['orphan']: {
                ...annotationFixtures.defaultAnnotation(),
                $orphan: true,
              },
            };
            const fakeThreads = [
              {},
              { annotation: annotations.annotation },
              { annotation: annotations.note },
              { annotation: annotations.orphan },
            ];
            fakeThreadState.selection.selectedTab = selectedTab;

            threadAnnotations(fakeThreadState);

            const threadFilterFn = fakeBuildThread.args[0][1].threadFilterFn;
            const filteredThreads = fakeThreads.filter(thread =>
              threadFilterFn(thread)
            );

            assert.lengthOf(filteredThreads, 1);
            assert.equal(
              filteredThreads[0].annotation,
              annotations[selectedTab]
            );
          });
        });

        it('should not filter the thread if annotations are filtered', () => {
          fakeThreadState.selection.filterQuery = 'foo';

          threadAnnotations(fakeThreadState);

          assert.isUndefined(fakeBuildThread.args[0][1].threadFilterFn);
        });

        it('should not filter the thread if there are applied focus filters', () => {
          fakeThreadState.selection.filters = { user: 'someusername' };

          threadAnnotations(fakeThreadState);

          assert.isUndefined(fakeBuildThread.args[0][1].threadFilterFn);
        });
      });

      context('other routes', () => {
        it('should not filter the thread', () => {
          fakeThreadState.route = 'nonsense';

          threadAnnotations(fakeThreadState);

          assert.isUndefined(fakeBuildThread.args[0][1].threadFilterFn);
        });
      });

      it('should filter annotations if a filter query is set', () => {
        fakeThreadState.selection.filterQuery = 'anything';
        const annotation = annotationFixtures.defaultAnnotation();
        fakeFilterAnnotations.returns([annotation]);

        threadAnnotations(fakeThreadState);

        const filterFn = fakeBuildThread.args[0][1].filterFn;

        assert.isFunction(filterFn);
        assert.calledOnce(fakeSearchFilter.generateFacetedFilter);
        assert.calledWith(
          fakeSearchFilter.generateFacetedFilter,
          fakeThreadState.selection.filterQuery,
          fakeThreadState.selection.filters
        );
        assert.isTrue(filterFn(annotation));
      });

      it('should filter annotations if there is an applied focus filter', () => {
        fakeThreadState.selection.filters = { user: 'somebody' };

        threadAnnotations(fakeThreadState);

        assert.isFunction(fakeBuildThread.args[0][1].filterFn);
        assert.calledWith(
          fakeSearchFilter.generateFacetedFilter,
          sinon.match.any,
          sinon.match({ user: 'somebody' })
        );
      });
    });
  });
});
