import { createStore } from '../../create-store';
import activity from '../activity';

describe('sidebar/store/modules/activity', () => {
  let store;

  beforeEach(() => {
    store = createStore([activity]);
  });

  describe('hasFetchedAnnotations', () => {
    it('returns false if no fetches have completed yet', () => {
      assert.isFalse(store.hasFetchedAnnotations());
    });

    it('returns false after fetch(es) started', () => {
      store.annotationFetchStarted();
      assert.isFalse(store.hasFetchedAnnotations());
    });

    it('returns true once a fetch has finished', () => {
      store.annotationFetchStarted();
      store.annotationFetchFinished();
      assert.isTrue(store.hasFetchedAnnotations());
    });
  });

  describe('#isLoading', () => {
    it('returns true when annotations have never been loaded', () => {
      assert.isTrue(store.isLoading());
    });

    it('returns true when API requests are in flight', () => {
      store.apiRequestStarted();
      assert.equal(store.isLoading(), true);
    });

    it('returns false when all requests end and annotations are fetched', () => {
      store.apiRequestStarted();
      store.apiRequestStarted();
      store.apiRequestFinished();
      store.annotationFetchStarted();

      assert.equal(store.isLoading(), true);

      store.apiRequestFinished();
      store.annotationFetchFinished();

      assert.equal(store.isLoading(), false);
    });
  });

  describe('isFetchingAnnotations', () => {
    it('returns false with the initial state', () => {
      assert.equal(store.isFetchingAnnotations(), false);
    });

    it('returns true when API requests are in flight', () => {
      store.annotationFetchStarted();
      assert.equal(store.isFetchingAnnotations(), true);
    });

    it('returns false when all requests end', () => {
      store.annotationFetchStarted();
      store.annotationFetchStarted();
      store.annotationFetchFinished();

      assert.equal(store.isFetchingAnnotations(), true);

      store.annotationFetchFinished();

      assert.equal(store.isFetchingAnnotations(), false);
    });
  });

  describe('isSavingAnnotation', () => {
    beforeEach(() => {
      store.annotationSaveStarted({ $tag: '1' });
      store.annotationSaveStarted({ $tag: '2' });
    });

    it('returns `true` if annotation $tag is in current save requests', () => {
      assert.isTrue(store.isSavingAnnotation({ $tag: '1' }));
    });

    it('returns `false` if annotation does not have a $tag', () => {
      assert.isFalse(store.isSavingAnnotation({}));
    });

    it('returns `false` if annotation `$tag` not in current save requests', () => {
      assert.isFalse(store.isSavingAnnotation({ $tag: '4' }));
    });
  });

  it('defaults `activeAnnotationFetches` counter to zero', () => {
    assert.equal(store.getState().activity.activeAnnotationFetches, 0);
  });

  describe('annotationFetchFinished', () => {
    it('triggers an error if no requests are in flight', () => {
      assert.throws(() => {
        store.annotationFetchFinished();
      });
    });

    it('increments `activeAnnotationFetches` counter when a new annotation fetch is started', () => {
      store.annotationFetchStarted();

      assert.equal(store.getState().activity.activeAnnotationFetches, 1);
    });
  });

  describe('annotationFetchStarted', () => {
    it('triggers an error if no requests are in flight', () => {
      assert.throws(() => {
        store.annotationFetchFinished();
      });
    });

    it('decrements `activeAnnotationFetches` counter when an annotation fetch is finished', () => {
      store.annotationFetchStarted();

      store.annotationFetchFinished();

      assert.equal(store.getState().activity.activeAnnotationFetches, 0);
    });
  });

  describe('#annotationSaveFinished', () => {
    it('removes matching `$tag` from saving-annotations Array when present', () => {
      store.annotationSaveStarted({ $tag: 'nine' });

      store.annotationSaveFinished({ $tag: 'nine' });

      assert.lengthOf(
        store.getState().activity.activeAnnotationSaveRequests,
        0
      );
    });

    it('does not remove `$tag` if it is not in the saving-annotations Array', () => {
      store.annotationSaveStarted({ $tag: 'nine' });

      store.annotationSaveFinished({ $tag: 'seven' });

      const annotationsBeingSaved =
        store.getState().activity.activeAnnotationSaveRequests;

      assert.lengthOf(annotationsBeingSaved, 1);
      assert.deepEqual(annotationsBeingSaved, ['nine']);
    });

    it('does not remove annotation from saving-annotations Array if it has no `$tag`', () => {
      store.annotationSaveStarted({ $tag: 'nine' });

      store.annotationSaveFinished({});

      const annotationsBeingSaved =
        store.getState().activity.activeAnnotationSaveRequests;

      assert.lengthOf(annotationsBeingSaved, 1);
      assert.deepEqual(annotationsBeingSaved, ['nine']);
    });

    it('does not remove non-matching annotations from saving-annotations Array', () => {
      store.annotationSaveStarted({ $tag: 'nine' });
      store.annotationSaveStarted({ $tag: 'four' });

      store.annotationSaveFinished({ $tag: 'four' });

      const annotationsBeingSaved =
        store.getState().activity.activeAnnotationSaveRequests;

      assert.lengthOf(annotationsBeingSaved, 1);
      assert.deepEqual(annotationsBeingSaved, ['nine']);
    });
  });

  describe('#annotationSaveStarted', () => {
    it('adds annotation `$tag` to list of saving annotations', () => {
      store.annotationSaveStarted({ $tag: 'five' });

      const annotationsBeingSaved =
        store.getState().activity.activeAnnotationSaveRequests;

      assert.lengthOf(annotationsBeingSaved, 1);
      assert.deepEqual(annotationsBeingSaved, ['five']);
    });

    it('does not add the same `$tag` twice', () => {
      store.annotationSaveStarted({ $tag: 'five' });
      store.annotationSaveStarted({ $tag: 'five' });

      const annotationsBeingSaved =
        store.getState().activity.activeAnnotationSaveRequests;

      assert.lengthOf(annotationsBeingSaved, 1);
      assert.deepEqual(annotationsBeingSaved, ['five']);
    });

    it('does not add the annotation if it does not have a `$tag`', () => {
      store.annotationSaveStarted({});

      const annotationsBeingSaved =
        store.getState().activity.activeAnnotationSaveRequests;

      assert.lengthOf(annotationsBeingSaved, 0);
    });
  });

  describe('#apiRequestFinished', () => {
    it('triggers an error if no requests are in flight', () => {
      assert.throws(() => {
        store.apiRequestFinished();
      });
    });
  });

  describe('#annotationResultCount', () => {
    it('returns the result count from the last API search/load', () => {
      assert.isNull(store.annotationResultCount());
      store.setAnnotationResultCount(5);
      assert.equal(store.annotationResultCount(), 5);
    });
  });
});
