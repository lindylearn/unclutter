import getApiUrl from '../get-api-url';

describe('sidebar/config/get-api-url', () => {
  context('when there is a service object in settings', () => {
    it('returns apiUrl from the service object', () => {
      const settings = {
        apiUrl: 'someApiUrl',
        services: [
          {
            apiUrl: 'someOtherApiUrl',
          },
        ],
      };
      assert.equal(getApiUrl(settings), settings.services[0].apiUrl);
    });
  });

  context('when there is no service object in settings', () => {
    it('returns apiUrl from the settings object', () => {
      const settings = {
        apiUrl: 'someApiUrl',
      };
      assert.equal(getApiUrl(settings), settings.apiUrl);
    });
  });

  context(
    'when there is a service object in settings but does not contain an apiUrl key',
    () => {
      it('throws error', () => {
        const settings = {
          apiUrl: 'someApiUrl',
          services: [{}],
        };
        assert.throws(
          () => {
            getApiUrl(settings);
          },
          Error,
          'Service should contain an apiUrl value'
        );
      });
    }
  );
});
