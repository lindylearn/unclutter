import * as fixtures from '../../../test/annotation-fixtures';
import * as metadata from '../../../helpers/annotation-metadata';
import { createStore } from '../../create-store';
import annotations from '../annotations';
import route from '../route';

function createTestStore() {
  return createStore([annotations, route], [{}]);
}

// Tests for some of the functionality in this store module are currently in
// still in `sidebar/store/test/index-test.js`. These tests should be migrated
// here in future.

describe('sidebar/store/modules/annotations', () => {
  describe('#addAnnotations()', () => {
    const ANCHOR_TIME_LIMIT = 1000;
    let clock;
    let store;

    function tagForID(id) {
      const storeAnn = store.findAnnotationByID(id);
      if (!storeAnn) {
        throw new Error(`No annotation with ID ${id}`);
      }
      return storeAnn.$tag;
    }

    beforeEach(() => {
      clock = sinon.useFakeTimers();
      store = createTestStore();
      store.changeRoute('sidebar', {});
    });

    afterEach(() => {
      clock.restore();
    });

    it('adds annotations not in the store', () => {
      const annot = fixtures.defaultAnnotation();
      store.addAnnotations([annot]);
      assert.match(store.getState().annotations.annotations, [
        sinon.match(annot),
      ]);
    });

    it('assigns a local tag to annotations', () => {
      const annotA = Object.assign(fixtures.defaultAnnotation(), { id: 'a1' });
      const annotB = Object.assign(fixtures.defaultAnnotation(), { id: 'a2' });

      store.addAnnotations([annotA, annotB]);

      const tags = store.getState().annotations.annotations.map(a => {
        return a.$tag;
      });

      assert.deepEqual(tags, ['t1', 't2']);
    });

    it('updates annotations with matching IDs in the store', () => {
      const annot = fixtures.defaultAnnotation();
      store.addAnnotations([annot]);
      const update = Object.assign({}, fixtures.defaultAnnotation(), {
        text: 'update',
      });
      store.addAnnotations([update]);

      const updatedAnnot = store.getState().annotations.annotations[0];
      assert.equal(updatedAnnot.text, 'update');
    });

    it('updates annotations with matching tags in the store', () => {
      const annot = fixtures.newAnnotation();
      annot.$tag = 'local-tag';
      store.addAnnotations([annot]);

      const saved = Object.assign({}, annot, { id: 'server-id' });
      store.addAnnotations([saved]);

      const annots = store.getState().annotations.annotations;
      assert.equal(annots.length, 1);
      assert.equal(annots[0].id, 'server-id');
    });

    it('preserves anchoring status of updated annotations', () => {
      const annot = fixtures.defaultAnnotation();
      store.addAnnotations([annot]);
      store.updateAnchorStatus({ [tagForID(annot.id)]: 'anchored' });

      const update = Object.assign({}, fixtures.defaultAnnotation(), {
        text: 'update',
      });
      store.addAnnotations([update]);

      const updatedAnnot = store.getState().annotations.annotations[0];
      assert.isFalse(updatedAnnot.$orphan);
    });

    it('sets the timeout flag on annotations that fail to anchor within a time limit', () => {
      const annot = fixtures.defaultAnnotation();
      store.addAnnotations([annot]);

      clock.tick(ANCHOR_TIME_LIMIT);

      assert.isTrue(store.getState().annotations.annotations[0].$anchorTimeout);
    });

    it('does not set the timeout flag on annotations that do anchor within a time limit', () => {
      const annot = fixtures.defaultAnnotation();
      store.addAnnotations([annot]);
      store.updateAnchorStatus({ [tagForID(annot.id)]: 'anchored' });

      clock.tick(ANCHOR_TIME_LIMIT);

      assert.isFalse(
        store.getState().annotations.annotations[0].$anchorTimeout
      );
    });

    it('does not attempt to modify orphan status if annotations are removed before anchoring timeout expires', () => {
      const annot = fixtures.defaultAnnotation();
      store.addAnnotations([annot]);
      store.updateAnchorStatus({ [tagForID(annot.id)]: 'anchored' });
      store.removeAnnotations([annot]);

      assert.doesNotThrow(() => {
        clock.tick(ANCHOR_TIME_LIMIT);
      });
    });

    it('does not expect annotations to anchor on the stream', () => {
      const isOrphan = function () {
        return !!metadata.isOrphan(store.getState().annotations.annotations[0]);
      };

      const annot = fixtures.defaultAnnotation();
      store.changeRoute('stream', { q: 'a-query' });
      store.addAnnotations([annot]);

      clock.tick(ANCHOR_TIME_LIMIT);

      assert.isFalse(isOrphan());
    });

    it('initializes the $orphan field for new annotations', () => {
      store.addAnnotations([fixtures.newAnnotation()]);
      assert.isFalse(store.getState().annotations.annotations[0].$orphan);
    });

    describe('clearAnnotations', () => {
      it('should clear annotations and annotation state from the store', () => {
        const annot = fixtures.defaultAnnotation();
        store.addAnnotations([annot]);
        store.focusAnnotations([annot.id]);
        store.highlightAnnotations([annot.id]);

        store.clearAnnotations();

        assert.isEmpty(store.getState().annotations.annotations);
        assert.isEmpty(store.focusedAnnotations());
        assert.isEmpty(store.highlightedAnnotations());
      });
    });

    describe('focusAnnotations', () => {
      it('adds the provided annotation IDs to the focused annotations', () => {
        store.focusAnnotations(['1', '2', '3']);
        assert.deepEqual(store.focusedAnnotations(), ['1', '2', '3']);
      });

      it('replaces any other focused annotation IDs', () => {
        store.focusAnnotations(['1']);
        store.focusAnnotations(['2', '3']);
        assert.deepEqual(store.focusedAnnotations(), ['2', '3']);
      });

      it('sets focused annotations to an empty object if no IDs provided', () => {
        store.focusAnnotations(['1']);
        store.focusAnnotations([]);
        assert.isEmpty(store.focusedAnnotations());
      });
    });

    describe('highlightAnnotations', () => {
      it('updates the highlighted state with the passed annotations', () => {
        store.highlightAnnotations(['id1', 'id2', 'id3']);
        assert.sameMembers(store.highlightedAnnotations(), [
          'id1',
          'id2',
          'id3',
        ]);
      });

      it('replaces any existing highlighted annotations', () => {
        store.highlightAnnotations(['id1', 'id2', 'id3']);
        store.highlightAnnotations(['id3', 'id4']);
        assert.sameMembers(store.highlightedAnnotations(), ['id3', 'id4']);
      });
    });

    describe('isAnnotationFocused', () => {
      it('returns true if the provided annotation ID is in the set of focused annotations', () => {
        store.focusAnnotations([1, 2]);
        assert.isTrue(store.isAnnotationFocused(2));
      });

      it('returns false if the provided annotation ID is not in the set of focused annotations', () => {
        assert.isFalse(store.isAnnotationFocused(2));
      });
    });
  });

  describe('#isWaitingToAnchorAnnotations', () => {
    it('returns true if there are unanchored annotations', () => {
      const unanchored = Object.assign(fixtures.oldAnnotation(), {
        $orphan: undefined,
      });
      const store = createTestStore();
      store.addAnnotations([unanchored]);
      assert.isTrue(store.isWaitingToAnchorAnnotations());
    });

    it('returns false if all annotations are anchored', () => {
      const store = createTestStore();
      store.addAnnotations([
        Object.assign(fixtures.oldPageNote(), { $orphan: false }),
        Object.assign(fixtures.defaultAnnotation(), { $orphan: false }),
      ]);
      assert.isFalse(store.isWaitingToAnchorAnnotations());
    });
  });

  describe('newAnnotations', () => {
    [
      {
        annotations: [
          fixtures.oldAnnotation(), // no
          fixtures.newAnnotation(), // yes
          fixtures.newAnnotation(), // yes
          fixtures.newReply(), // yes
        ],
        expectedLength: 3,
      },
      {
        annotations: [fixtures.oldAnnotation(), fixtures.newHighlight()],
        expectedLength: 0,
      },
      {
        annotations: [
          fixtures.newHighlight(), // no
          fixtures.newReply(), // yes
          fixtures.oldAnnotation(), // no
          fixtures.newPageNote(), // yes
        ],
        expectedLength: 2,
      },
    ].forEach(testCase => {
      it('returns number of unsaved, new annotations', () => {
        const store = createTestStore();
        store.addAnnotations(testCase.annotations);
        assert.lengthOf(store.newAnnotations(), testCase.expectedLength);
      });
    });
  });

  describe('newHighlights', () => {
    [
      {
        annotations: [fixtures.oldAnnotation(), fixtures.newAnnotation()],
        expectedLength: 0,
      },
      {
        annotations: [
          fixtures.oldAnnotation(),
          Object.assign(fixtures.newHighlight(), { $tag: 'atag' }),
          Object.assign(fixtures.newHighlight(), { $tag: 'anothertag' }),
        ],
        expectedLength: 2,
      },
      {
        annotations: [
          fixtures.oldHighlight(),
          Object.assign(fixtures.newHighlight(), { $tag: 'atag' }),
          Object.assign(fixtures.newHighlight(), { $tag: 'anothertag' }),
        ],
        expectedLength: 2,
      },
    ].forEach(testCase => {
      it('returns number of unsaved, new highlights', () => {
        const store = createTestStore();
        store.addAnnotations(testCase.annotations);
        assert.lengthOf(store.newHighlights(), testCase.expectedLength);
      });
    });
  });

  describe('noteCount', () => {
    it('returns number of page notes', () => {
      const store = createTestStore();
      store.addAnnotations([
        fixtures.oldPageNote(),
        fixtures.oldAnnotation(),
        fixtures.defaultAnnotation(),
      ]);
      assert.deepEqual(store.noteCount(), 1);
    });
  });

  describe('annotationCount', () => {
    it('returns number of annotations', () => {
      const store = createTestStore();
      store.addAnnotations([
        fixtures.oldPageNote(),
        fixtures.oldAnnotation(),
        fixtures.defaultAnnotation(),
      ]);
      assert.deepEqual(store.annotationCount(), 2);
    });
  });

  describe('allAnnotations', () => {
    it('returns all the annotations in the store', () => {
      const store = createTestStore();
      const annotation1 = fixtures.oldPageNote();
      const annotation2 = fixtures.defaultAnnotation();
      store.addAnnotations([annotation1, annotation2]);
      assert.deepEqual(store.allAnnotations(), [
        store.findAnnotationByID(annotation1.id),
        store.findAnnotationByID(annotation2.id),
      ]);
    });
  });

  describe('orphanCount', () => {
    it('returns number of orphaned annotations', () => {
      const orphan = Object.assign(fixtures.oldAnnotation(), { $orphan: true });
      const store = createTestStore();
      store.addAnnotations([
        orphan,
        fixtures.oldAnnotation(),
        fixtures.defaultAnnotation(),
      ]);
      assert.deepEqual(store.orphanCount(), 1);
    });
  });

  describe('#savedAnnotations', () => {
    it('returns annotations which are saved', () => {
      const store = createTestStore();
      store.addAnnotations([
        fixtures.newAnnotation(),
        fixtures.defaultAnnotation(),
      ]);

      // `assert.match` is used here to ignore internal properties added by
      // `store.addAnnotations`.
      assert.match(store.savedAnnotations(), [
        sinon.match(fixtures.defaultAnnotation()),
      ]);
    });
  });

  describe('#findIDsForTags', () => {
    it('returns the IDs corresponding to the provided local tags', () => {
      const store = createTestStore();
      const ann = fixtures.defaultAnnotation();
      store.addAnnotations([Object.assign(ann, { $tag: 't1' })]);
      assert.deepEqual(store.findIDsForTags(['t1']), [ann.id]);
    });

    it('does not return IDs for annotations that do not have an ID', () => {
      const store = createTestStore();
      const ann = fixtures.newAnnotation();
      store.addAnnotations([Object.assign(ann, { $tag: 't1' })]);
      assert.deepEqual(store.findIDsForTags(['t1']), []);
    });
  });

  describe('#hideAnnotation', () => {
    it('sets the `hidden` state to `true`', () => {
      const store = createTestStore();
      const ann = fixtures.moderatedAnnotation({ hidden: false });

      store.addAnnotations([ann]);
      store.hideAnnotation(ann.id);

      const storeAnn = store.findAnnotationByID(ann.id);
      assert.equal(storeAnn.hidden, true);
    });
  });

  describe('#unhideAnnotation', () => {
    it('sets the `hidden` state to `false`', () => {
      const store = createTestStore();
      const ann = fixtures.moderatedAnnotation({ hidden: true });

      store.addAnnotations([ann]);
      store.unhideAnnotation(ann.id);

      const storeAnn = store.findAnnotationByID(ann.id);
      assert.equal(storeAnn.hidden, false);
    });
  });

  describe('#removeAnnotations', () => {
    it('removes the annotation', () => {
      const store = createTestStore();
      const ann = fixtures.defaultAnnotation();
      store.addAnnotations([ann]);
      store.removeAnnotations([ann]);
      assert.equal(store.getState().annotations.annotations.length, 0);
    });
  });

  describe('#updateFlagStatus', () => {
    [
      {
        description: 'non-moderator flags annotation',
        wasFlagged: false,
        nowFlagged: true,
        oldModeration: undefined,
        newModeration: undefined,
      },
      {
        description: 'non-moderator un-flags an annotation',
        wasFlagged: true,
        nowFlagged: false,
        oldModeration: undefined,
        newModeration: undefined,
      },
      {
        description: 'moderator un-flags an already un-flagged annotation',
        wasFlagged: false,
        nowFlagged: false,
        oldModeration: { flagCount: 1 },
        newModeration: { flagCount: 1 },
      },
      {
        description: 'moderator flags an already flagged annotation',
        wasFlagged: true,
        nowFlagged: true,
        oldModeration: { flagCount: 1 },
        newModeration: { flagCount: 1 },
      },
      {
        description: 'moderator flags an annotation',
        wasFlagged: false,
        nowFlagged: true,
        oldModeration: { flagCount: 0 },
        newModeration: { flagCount: 1 },
      },
      {
        description: 'moderator un-flags an annotation',
        wasFlagged: true,
        nowFlagged: false,
        oldModeration: { flagCount: 1 },
        newModeration: { flagCount: 0 },
      },
    ].forEach(testCase => {
      it(`updates the flagged status of an annotation when a ${testCase.description}`, () => {
        const store = createTestStore();
        const ann = fixtures.defaultAnnotation();
        ann.flagged = testCase.wasFlagged;
        ann.moderation = testCase.oldModeration;

        store.addAnnotations([ann]);
        store.updateFlagStatus(ann.id, testCase.nowFlagged);

        const storeAnn = store.findAnnotationByID(ann.id);
        assert.equal(storeAnn.flagged, testCase.nowFlagged);
        assert.deepEqual(storeAnn.moderation, testCase.newModeration);
      });
    });
  });

  describe('#annotationExists', () => {
    it('returns false if annotation does not exist', () => {
      const store = createTestStore();
      assert.isFalse(store.annotationExists('foobar'));
    });

    it('returns true if annotation does exist', () => {
      const store = createTestStore();
      const annot = fixtures.defaultAnnotation();
      store.addAnnotations([annot]);
      assert.isTrue(store.annotationExists(annot.id));
    });
  });
});
