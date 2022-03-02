import { serviceConfig } from '../service-config';

describe('config/service-config', () => {
  it('returns null if services is not an array', () => {
    const settings = {
      services: 'someString',
    };

    assert.isNull(serviceConfig(settings));
  });

  it('returns null if the settings object has no services', () => {
    const settings = {
      services: [],
    };

    assert.isNull(serviceConfig(settings));
  });

  it('returns the first service in the settings object', () => {
    const settings = {
      services: [
        {
          key: 'val',
        },
      ],
    };

    assert.deepEqual(settings.services[0], serviceConfig(settings));
  });
});
