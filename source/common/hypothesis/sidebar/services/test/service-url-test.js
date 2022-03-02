import { ServiceURLService } from '../service-url';

const links = {
  'account.settings': 'https://hypothes.is/account/settings',
};

describe('ServiceURLService', () => {
  let fakeStore;
  let fakeAPIRoutes;

  beforeEach(() => {
    fakeStore = {
      updateLinks: sinon.stub(),
    };
    fakeAPIRoutes = {
      links: sinon.stub().resolves(links),
    };

    sinon.stub(console, 'warn');
  });

  afterEach(() => {
    console.warn.restore();
  });

  describe('#init', () => {
    it('fetches links and updates store with response', async () => {
      const service = new ServiceURLService(fakeAPIRoutes, fakeStore);

      await service.init();

      assert.calledWith(fakeStore.updateLinks, links);
    });

    it('logs a warning if links cannot be fetched', async () => {
      fakeAPIRoutes.links.returns(Promise.reject(new Error('Fetch failed')));
      const service = new ServiceURLService(fakeAPIRoutes, fakeStore);

      await service.init();

      assert.notCalled(fakeStore.updateLinks);
      assert.calledWith(
        console.warn,
        'Failed to fetch Hypothesis links: Fetch failed'
      );
    });
  });
});
