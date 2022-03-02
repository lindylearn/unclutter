import fakeReduxStore from '../../test/fake-redux-store';
import { PersistedDefaultsService } from '../persisted-defaults';

const DEFAULT_KEYS = {
  annotationPrivacy: 'hypothesis.privacy',
  focusedGroup: 'hypothesis.groups.focus',
};

describe('PersistedDefaultsService', () => {
  let fakeLocalStorage;
  let fakeGetItem;
  let fakeSetItem;

  let fakeStore;

  beforeEach(() => {
    fakeStore = fakeReduxStore(
      {
        defaults: {
          annotationPrivacy: null,
        },
      },
      {
        setDefault: sinon.stub(),
        getDefault: sinon.stub(),
        getDefaults: sinon.stub().returns({ annotationPrivacy: 'earmuffs' }),
      }
    );

    fakeGetItem = sinon.stub();
    fakeSetItem = sinon.stub();

    fakeLocalStorage = {
      getItem: fakeGetItem,
      setItem: fakeSetItem,
    };
  });

  function createService() {
    return new PersistedDefaultsService(fakeLocalStorage, fakeStore);
  }

  describe('#init', () => {
    it('should retrieve persisted defaults from `localStorage`', () => {
      const svc = createService();

      svc.init();

      // Retrieving each known default from localStorage...
      assert.equal(
        fakeLocalStorage.getItem.callCount,
        Object.keys(DEFAULT_KEYS).length
      );

      Object.keys(DEFAULT_KEYS).forEach(defaultKey => {
        assert.calledWith(fakeLocalStorage.getItem, DEFAULT_KEYS[defaultKey]);
      });
    });

    it('should set defaults on the store with the values returned by `localStorage`', () => {
      fakeLocalStorage.getItem.returns('bananas');
      const svc = createService();

      svc.init();

      Object.keys(DEFAULT_KEYS).forEach(defaultKey => {
        assert.calledWith(fakeStore.setDefault, defaultKey, 'bananas');
      });
    });

    it('should set default to `null` if key non-existent in storage', () => {
      fakeLocalStorage.getItem.returns(null);
      const svc = createService();

      svc.init();

      Object.keys(DEFAULT_KEYS).forEach(defaultKey => {
        assert.calledWith(fakeStore.setDefault, defaultKey, null);
      });
    });

    context('when defaults change in the store', () => {
      it('should persist changes to a known default', () => {
        const svc = createService();
        svc.init();

        const updatedDefaults = { annotationPrivacy: 'carrots' };

        fakeStore.getDefaults.returns(updatedDefaults);
        fakeStore.setState({ defaults: updatedDefaults });

        assert.calledOnce(fakeLocalStorage.setItem);
        assert.calledWith(
          fakeLocalStorage.setItem,
          DEFAULT_KEYS.annotationPrivacy,
          'carrots'
        );
      });

      it('should persist subsequent changes to known defaults', () => {
        const svc = createService();
        svc.init();

        const updatedDefaults = { annotationPrivacy: 'carrots' };
        const reupdatedDefaults = { annotationPrivacy: 'potatoes' };

        fakeStore.getDefaults.returns(updatedDefaults);
        fakeStore.setState({ defaults: updatedDefaults });
        fakeStore.getDefaults.returns(reupdatedDefaults);
        fakeStore.setState({ defaults: reupdatedDefaults });

        assert.calledTwice(fakeLocalStorage.setItem);
        assert.calledWith(
          fakeLocalStorage.setItem,
          DEFAULT_KEYS.annotationPrivacy,
          'carrots'
        );
        assert.calledWith(
          fakeLocalStorage.setItem,
          DEFAULT_KEYS.annotationPrivacy,
          'potatoes'
        );
      });

      it('should not update local storage if default has not changed', () => {
        const defaults = { focusedGroup: 'carrots' };
        fakeLocalStorage.getItem.returns('carrots');
        fakeStore.getDefaults.returns(defaults);
        fakeStore.setState({ defaults });
        const svc = createService();
        svc.init();

        fakeStore.getDefaults.returns(defaults);
        fakeStore.setState({ defaults });

        assert.notCalled(fakeLocalStorage.setItem);
      });

      it('should not persist changes for default keys it is unaware of', () => {
        const svc = createService();
        svc.init();

        fakeStore.getDefaults.returns({ foople: 'grapefruit' });
        fakeStore.setState({ defaults: { foople: 'grapefruit' } });

        assert.notCalled(fakeLocalStorage.setItem);
      });
    });
  });
});
