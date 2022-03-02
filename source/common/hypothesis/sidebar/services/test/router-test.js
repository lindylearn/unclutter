import EventEmitter from 'tiny-emitter';
import { RouterService } from '../router';

const fixtures = [
  // Sidebar for the embedded Hypothesis client.
  {
    path: '/app.html',
    route: 'sidebar',
    params: {},
  },

  // Pages in "h" where the content is the client app.
  {
    path: '/notebook',
    route: 'notebook',
    params: {},
  },
  {
    path: '/a/foo',
    route: 'annotation',
    params: { id: 'foo' },
  },
  {
    path: '/stream',
    search: 'q=foobar',
    route: 'stream',
    params: { q: 'foobar' },
  },

  // Browser extension.
  {
    path: '/client/app.html',
    route: 'sidebar',
    params: {},
  },
  {
    path: '/client/notebook.html',
    route: 'notebook',
    params: {},
  },
];

describe('RouterService', () => {
  let fakeWindow;
  let fakeStore;

  function createService() {
    return new RouterService(fakeWindow, fakeStore);
  }

  function updateUrl(path, search) {
    fakeWindow.location.pathname = path;
    fakeWindow.location.search = search;
  }

  beforeEach(() => {
    const emitter = new EventEmitter();
    fakeWindow = {
      location: {
        pathname: '',
        search: '',
      },
      history: {
        pushState: sinon.stub(),
      },
      addEventListener: emitter.on.bind(emitter),
      emit: emitter.emit.bind(emitter),
    };
    fakeStore = {
      changeRoute: sinon.stub(),
    };
  });

  describe('#sync', () => {
    fixtures.forEach(({ path, search, route, params }) => {
      it('updates the active route in the store', () => {
        updateUrl(path, search);

        const svc = createService();
        svc.sync();

        assert.calledWith(fakeStore.changeRoute, route, params);
      });
    });
  });

  describe('#navigate', () => {
    fixtures.forEach(({ path, search, route, params }) => {
      // Skip scenarios where the app launches with a single route and cannot
      // be navigated elsewhere afterwards.
      if (route === 'sidebar' || path.startsWith('/client/')) {
        return;
      }

      it('updates the URL', () => {
        const svc = createService();

        svc.navigate(route, params);

        const expectedUrl = path + (search ? `?${search}` : '');
        assert.calledWith(fakeWindow.history.pushState, {}, '', expectedUrl);
      });
    });

    it('throws an error if route does not have a fixed URL', () => {
      const svc = createService();
      assert.throws(() => {
        svc.navigate('sidebar');
      }, 'Cannot generate URL for route "sidebar"');
    });

    it('updates the active route in the store', () => {
      const svc = createService();

      updateUrl('/stream', 'q=foobar');
      svc.navigate('stream', { q: 'foobar' });

      assert.calledWith(fakeStore.changeRoute, 'stream', { q: 'foobar' });
    });
  });

  context('when a browser history navigation happens', () => {
    fixtures.forEach(({ path, search, route, params }) => {
      it('updates the active route in the store', () => {
        const svc = createService();
        svc.sync();
        fakeStore.changeRoute.resetHistory();

        updateUrl(path, search);
        fakeWindow.emit('popstate');

        assert.calledWith(fakeStore.changeRoute, route, params);
      });
    });

    it('does nothing if the initial call to `sync()` has not happened', () => {
      createService();

      // Simulate a "popstate" event being triggered by the browser before
      // the app is ready to initialize the router by calling `sync()`.
      //
      // Safari and Chrome do this when the page loads. Firefox does not.
      fakeWindow.emit('popstate');

      assert.notCalled(fakeStore.changeRoute);
    });
  });
});
