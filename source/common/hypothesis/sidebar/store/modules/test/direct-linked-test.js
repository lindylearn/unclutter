import { createStore } from '../../create-store';
import directLinked from '../direct-linked';

describe('sidebar/store/modules/direct-linked', () => {
  let store;
  let fakeSettings;

  const getDirectLinkedState = () => {
    return store.getState().directLinked;
  };

  beforeEach(() => {
    fakeSettings = {};
    store = createStore([directLinked], [fakeSettings]);
  });

  describe('setDirectLinkedGroupFetchFailed', () => {
    it('sets directLinkedGroupFetchFailed to true', () => {
      store.setDirectLinkedGroupFetchFailed();

      assert.isTrue(getDirectLinkedState().directLinkedGroupFetchFailed);
    });
  });

  describe('clearDirectLinkedGroupFetchFailed', () => {
    it('sets directLinkedGroupFetchFailed to false', () => {
      store.setDirectLinkedGroupFetchFailed();

      store.clearDirectLinkedGroupFetchFailed();

      assert.isFalse(getDirectLinkedState().directLinkedGroupFetchFailed);
    });
  });

  it('sets directLinkedAnnotationId to settings.annotations during store init', () => {
    fakeSettings.annotations = 'ann-id';

    store = createStore([directLinked], [fakeSettings]);

    assert.equal(store.directLinkedAnnotationId(), 'ann-id');
  });

  describe('setDirectLinkedAnnotationId', () => {
    it('sets directLinkedAnnotationId to the specified annotation id', () => {
      store.setDirectLinkedAnnotationId('ann-id');

      assert.equal(store.directLinkedAnnotationId(), 'ann-id');
    });
  });

  it('sets directLinkedGroupId to settings.group during store init', () => {
    fakeSettings.group = 'group-id';

    store = createStore([directLinked], [fakeSettings]);

    assert.equal(store.directLinkedGroupId(), 'group-id');
  });

  describe('setDirectLinkedGroupId', () => {
    it('sets directLinkedGroupId to the specified group id', () => {
      store.setDirectLinkedGroupId('group-id');

      assert.equal(store.directLinkedGroupId(), 'group-id');
    });
  });

  describe('clearDirectLinkedIds', () => {
    it('sets direct-link annotations and group ids to null', () => {
      store.setDirectLinkedGroupId('ann-id');
      store.setDirectLinkedGroupId('group-id');

      store.clearDirectLinkedIds();

      assert.isNull(store.directLinkedGroupId());
      assert.isNull(store.directLinkedAnnotationId());
    });
  });

  describe('selectors', () => {
    describe('#directLinkedAnnotationId', () => {
      it('should return the current direct-linked annotation ID', () => {
        store.setDirectLinkedAnnotationId('ann-id');
        assert.equal(store.directLinkedAnnotationId(), 'ann-id');
      });

      it('should return `null` if no direct-linked annotation ID', () => {
        assert.isNull(store.directLinkedAnnotationId());
      });
    });

    describe('#directLinkedGroupFetchFailed', () => {
      it('should return the group fetch failed status', () => {
        store.setDirectLinkedGroupFetchFailed(true);
        assert.isTrue(store.directLinkedGroupFetchFailed());
      });
    });

    describe('#directLinkedGroupId', () => {
      it('should return the current direct-linked group ID', () => {
        store.setDirectLinkedGroupId('group-id');
        assert.equal(store.directLinkedGroupId(), 'group-id');
      });

      it('should return `null` if no direct-linked group ID', () => {
        assert.isNull(store.directLinkedGroupId());
      });
    });
  });
});
