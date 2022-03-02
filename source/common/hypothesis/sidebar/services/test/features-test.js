import bridgeEvents from '../../../shared/bridge-events';
import { FeaturesService } from '../features';

describe('FeaturesService', () => {
  let fakeBridge;
  let fakeStore;

  beforeEach(() => {
    fakeBridge = {
      call: sinon.stub(),
    };

    fakeStore = {
      subscribe: sinon.stub(),
      frames: sinon.stub().returns([]),
      profile: sinon.stub().returns({
        features: {
          feature_on: true,
          feature_off: false,
        },
      }),
    };
  });

  function createService() {
    const service = new FeaturesService(fakeBridge, fakeStore);
    service.init();
    return service;
  }

  function notifyStoreSubscribers() {
    const subscribers = fakeStore.subscribe.args.map(args => args[0]);
    subscribers.forEach(s => s());
  }

  it('should broadcast feature flags to annotator if flags change', () => {
    createService();

    // First update, with no changes to feature flags.
    notifyStoreSubscribers();
    assert.notCalled(fakeBridge.call);

    // Second update, with changes to feature flags.
    fakeStore.profile.returns({
      features: {
        feature_on: true,
        feature_off: true,
      },
    });

    notifyStoreSubscribers();

    assert.calledWith(
      fakeBridge.call,
      bridgeEvents.FEATURE_FLAGS_UPDATED,
      fakeStore.profile().features
    );
  });

  it('should broadcast feature flags to annotator if a new frame connects', () => {
    createService();

    // First update, with no changes to frames.
    notifyStoreSubscribers();
    assert.notCalled(fakeBridge.call);

    // Second update, with changes to frames.
    fakeStore.frames.returns([{ uri: 'https://example.com' }]);

    notifyStoreSubscribers();

    assert.calledWith(
      fakeBridge.call,
      bridgeEvents.FEATURE_FLAGS_UPDATED,
      fakeStore.profile().features
    );
  });
});
