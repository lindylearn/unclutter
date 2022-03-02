import events from '../../shared/bridge-events';
import features from '../features';
import { $imports } from '../features';

describe('features - annotation layer', () => {
  let featureFlagsUpdateHandler;
  let fakeWarnOnce;

  const initialFeatures = {
    feature_on: true,
    feature_off: false,
  };

  const setFeatures = function (features) {
    featureFlagsUpdateHandler(features || initialFeatures);
  };

  beforeEach(() => {
    fakeWarnOnce = sinon.stub();
    $imports.$mock({
      '../shared/warn-once': fakeWarnOnce,
    });

    features.init({
      on: function (topic, handler) {
        if (topic === events.FEATURE_FLAGS_UPDATED) {
          featureFlagsUpdateHandler = handler;
        }
      },
    });

    // set default features
    setFeatures();
  });

  afterEach(() => {
    features.reset();
    $imports.$restore();
  });

  describe('flagEnabled', () => {
    it('should retrieve features data', () => {
      assert.equal(features.flagEnabled('feature_on'), true);
      assert.equal(features.flagEnabled('feature_off'), false);
    });

    it('should return false if features have not been loaded', () => {
      // simulate feature data not having been loaded yet
      features.reset();
      assert.equal(features.flagEnabled('feature_on'), false);
    });

    it('should return false for unknown flags', () => {
      assert.isFalse(features.flagEnabled('unknown_feature'));
    });

    it('should warn when accessing unknown flags', () => {
      assert.isFalse(features.flagEnabled('unknown_feature'));
      assert.calledOnce(fakeWarnOnce);
      assert.calledWith(fakeWarnOnce, 'looked up unknown feature');
    });
  });
});
