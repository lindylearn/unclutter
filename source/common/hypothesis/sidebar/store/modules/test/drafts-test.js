import { createStore } from '../../create-store';
import annotations from '../annotations';
import drafts from '../drafts';
import { Draft } from '../drafts';
import selection from '../selection';
import immutable from '../../../util/immutable';

const fixtures = immutable({
  draftWithText: {
    isPrivate: false,
    text: 'some text',
    tags: [],
  },
  draftWithTags: {
    isPrivate: false,
    text: '',
    tags: ['atag'],
  },
  emptyDraft: {
    isPrivate: false,
    text: '',
    tags: [],
  },
  annotation: {
    id: 'my_annotation',
    $tag: 'my_annotation_tag',
  },
});

describe('store/modules/drafts', () => {
  let store;

  beforeEach(() => {
    store = createStore([drafts, annotations, selection], [{}]);
  });

  describe('Draft', () => {
    it('constructor', () => {
      const draft = new Draft(fixtures.annotation, fixtures.draftWithText);
      assert.deepEqual(draft, {
        annotation: {
          ...fixtures.annotation,
        },
        ...fixtures.draftWithText,
      });
    });
    describe('#isEmpty', () => {
      it('returns false if draft has tags or text', () => {
        const draft = new Draft(fixtures.annotation, fixtures.draftWithText);
        assert.isFalse(draft.isEmpty());
      });
      it('returns true if draft has no tags or text', () => {
        const draft = new Draft(fixtures.annotation, fixtures.emptyDraft);
        assert.isTrue(draft.isEmpty());
      });
    });
    describe('#match', () => {
      it('matches an annotation with the same tag or id', () => {
        const draft = new Draft(fixtures.annotation, fixtures.draftWithText);
        assert.isTrue(
          draft.match({
            id: fixtures.annotation.id,
          })
        );
        assert.isTrue(
          draft.match({
            $tag: fixtures.annotation.$tag,
          })
        );
      });
      it('does not match an annotation with a different tag or id', () => {
        const draft = new Draft(fixtures.annotation, fixtures.draftWithText);
        assert.isFalse(
          draft.match({
            id: 'fake',
          })
        );
        assert.isFalse(
          draft.match({
            $tag: 'fake',
          })
        );
      });
    });
  });

  describe('#getDraftIfNotEmpty', () => {
    it('returns the draft if it has tags', () => {
      store.createDraft(fixtures.annotation, fixtures.draftWithTags);
      assert.deepEqual(
        store.getDraftIfNotEmpty(fixtures.annotation).annotation,
        fixtures.annotation
      );
    });

    it('returns the draft if it has text', () => {
      store.createDraft(fixtures.annotation, fixtures.draftWithText);
      assert.deepEqual(
        store.getDraftIfNotEmpty(fixtures.annotation).annotation,
        fixtures.annotation
      );
    });

    it('returns null if the text and tags are empty', () => {
      store.createDraft(fixtures.annotation, fixtures.emptyDraft);
      assert.isNull(store.getDraftIfNotEmpty(fixtures.annotation));
    });

    it('returns null if there is no matching draft', () => {
      assert.isNull(store.getDraftIfNotEmpty('fake'));
    });
  });

  describe('#createDraft', () => {
    it('should save changes', () => {
      assert.notOk(store.getDraft(fixtures.annotation));
      store.createDraft(fixtures.annotation, fixtures.draftWithText);
      assert.deepEqual(
        store.getDraft(fixtures.annotation),
        new Draft(fixtures.annotation, fixtures.draftWithText)
      );
    });

    it('should replace existing drafts with the same ID', () => {
      const fakeAnnotation = {
        id: 'my_annotation',
      };
      const fakeDraft = {
        isPrivate: true,
        tags: ['foo'],
        text: '',
      };
      store.createDraft(fakeAnnotation, {
        ...fakeDraft,
        text: 'foo',
      });
      assert.equal(store.getDraft(fakeAnnotation).text, 'foo');

      // now replace the draft
      store.createDraft(fakeAnnotation, {
        ...fakeDraft,
        text: 'bar',
      });
      assert.equal(store.getDraft(fakeAnnotation).text, 'bar');
    });

    it('should replace existing drafts with the same tag', () => {
      const fakeAnnotation = {
        $tag: 'my_annotation_tag',
      };
      const fakeDraft = {
        isPrivate: true,
        tags: ['foo'],
        text: '',
      };
      store.createDraft(fakeAnnotation, {
        ...fakeDraft,
        text: 'foo',
      });
      assert.equal(store.getDraft(fakeAnnotation).text, 'foo');

      // now replace the draft
      store.createDraft(fakeAnnotation, {
        ...fakeDraft,
        text: 'bar',
      });
      assert.equal(store.getDraft(fakeAnnotation).text, 'bar');
    });
  });

  describe('#countDrafts', () => {
    it('should count drafts', () => {
      assert.equal(store.countDrafts(), 0);
      store.createDraft({ id: '1' }, fixtures.draftWithText);
      assert.equal(store.countDrafts(), 1);

      // since same id, this  performs a replace, should still be 1 count
      store.createDraft({ id: '1' }, fixtures.draftWithText);
      assert.equal(store.countDrafts(), 1);

      store.createDraft({ id: '2' }, fixtures.draftWithText);
      assert.equal(store.countDrafts(), 2);
    });
  });

  describe('#discardAllDrafts', () => {
    it('should remove all drafts', () => {
      store.createDraft({ id: '1' }, fixtures.draftWithText);
      store.createDraft({ id: '2' }, fixtures.draftWithText);
      store.discardAllDrafts(fixtures.annotation);
      assert.equal(store.countDrafts(), 0);
    });
  });

  describe('#removeDraft', () => {
    it('should remove drafts', () => {
      store.createDraft(fixtures.annotation, fixtures.draftWithText);
      assert.isOk(store.getDraft(fixtures.annotation));
      store.removeDraft(fixtures.annotation);
      assert.isNotOk(store.getDraft(fixtures.annotation));
    });
  });

  describe('#unsavedAnnotations', () => {
    it('should return unsaved annotations which have drafts', () => {
      const fakeAnnotation1 = {
        $tag: 'local-tag1',
        id: undefined,
      };
      const fakeAnnotation2 = {
        $tag: 'local-tag2',
        id: undefined,
      };
      store.createDraft(fakeAnnotation1, fixtures.draftWithText);
      store.createDraft(fakeAnnotation2, fixtures.draftWithText);
      assert.deepEqual(store.unsavedAnnotations(), [
        fakeAnnotation1,
        fakeAnnotation2,
      ]);
    });

    it('should not return saved annotations which have drafts', () => {
      store.createDraft(fixtures.annotation, fixtures.draftWithText);
      assert.deepEqual(store.unsavedAnnotations(), []);
    });
  });

  describe('#deleteNewAndEmptyDrafts', () => {
    [
      {
        key: 'should remove new and empty drafts',
        annotation: {
          id: undefined,
          $tag: 'my_annotation_tag',
        },
        draft: fixtures.emptyDraft,
        shouldRemove: true,
      },
      {
        key: 'should not remove drafts with an id',
        annotation: {
          id: 'my_id',
          $tag: 'my_annotation_tag',
        },
        draft: fixtures.emptyDraft,
        shouldRemove: false,
      },
      {
        key: 'should not remove drafts with text',
        annotation: {
          id: undefined,
          $tag: 'my_annotation_tag',
        },
        draft: fixtures.draftWithText,
        shouldRemove: false,
      },
    ].forEach(test => {
      it(test.key, () => {
        store.createDraft(test.annotation, test.draft);
        store.deleteNewAndEmptyDrafts([test.annotation]);
        if (test.shouldRemove) {
          assert.isNotOk(store.getDraft(test.annotation));
        } else {
          assert.isOk(store.getDraft(test.annotation));
        }
      });
    });
  });
});
