import { createStore } from '../../create-store';
import defaults from '../defaults';

describe('store/modules/defaults', () => {
  let store;

  beforeEach(() => {
    store = createStore([defaults]);
  });

  describe('actions', () => {
    describe('#setDefault', () => {
      it('should update the indicated default with the new value', () => {
        const beforePrivacy = store.getDefault('annotationPrivacy');
        store.setDefault('annotationPrivacy', 'private');

        assert.isNull(beforePrivacy);
        assert.equal(store.getDefault('annotationPrivacy'), 'private');
      });

      it('should add a new property to the `defaults` state if non-existent', () => {
        store.setDefault('foo', 'bar');

        const latestDefaults = store.getDefaults();
        assert.include(latestDefaults, { foo: 'bar' });
      });
    });
  });

  describe('selectors', () => {
    describe('#getDefault', () => {
      it('should return the current value for the given default', () => {
        store.setDefault('annotationPrivacy', 'shared');
        assert.equal(store.getDefault('annotationPrivacy'), 'shared');
      });

      it('should return `null` for default keys that have no value (yet)', () => {
        assert.isNull(store.getDefault('annotationPrivacy'));
      });

      it('should return `undefined` if default key (property) is unrecognized', () => {
        // This differentiates from `null`, which is a known property but not set
        assert.isUndefined(store.getDefault('someRandomKey'));
      });
    });

    describe('#getDefaults', () => {
      it('should return all defined defaults', () => {
        store.setDefault('foo', 'bar');

        const latestDefaults = store.getDefaults();

        assert.hasAllKeys(latestDefaults, [
          'foo',
          'annotationPrivacy',
          'focusedGroup',
        ]);
      });
    });
  });
});
