import { isThirdPartyService } from '../is-third-party-service';
import { $imports } from '../is-third-party-service';

describe('sidebar/helpers/is-third-party-service', () => {
  let fakeServiceConfig;
  let fakeSettings;

  beforeEach(() => {
    fakeServiceConfig = sinon.stub();
    fakeSettings = { authDomain: 'hypothes.is' };

    $imports.$mock({
      '../config/service-config': { serviceConfig: fakeServiceConfig },
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  it('returns false for first-party services', () => {
    fakeServiceConfig.returns({ authority: 'hypothes.is' });

    assert.isFalse(isThirdPartyService(fakeSettings));
  });

  it('returns true for third-party services', () => {
    fakeServiceConfig.returns({ authority: 'elifesciences.org' });

    assert.isTrue(isThirdPartyService(fakeSettings));
  });

  it("returns false if there's no service config", () => {
    fakeServiceConfig.returns(null);

    assert.isFalse(isThirdPartyService(fakeSettings));
  });

  // It's not valid for a service config object to not contain an authority
  // (authority is a required field) but at the time of writing the config
  // isn't validated when it's read in, so make sure that isThirdPartyService()
  // handles invalid configs.
  it("returns false if the service config doesn't contain an authority", () => {
    fakeServiceConfig.returns({});

    assert.isFalse(isThirdPartyService(fakeSettings));
  });
});
