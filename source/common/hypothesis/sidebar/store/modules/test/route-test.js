import { createStore } from '../../create-store';
import route from '../route';

describe('store/modules/route', () => {
  let store;

  beforeEach(() => {
    store = createStore([route]);
  });

  it('sets initial route to `null`', () => {
    assert.equal(store.route(), null);
  });

  it('sets initial params to `{}`', () => {
    assert.deepEqual(store.routeParams(), {});
  });

  describe('#changeRoute', () => {
    it('sets the current route name and params', () => {
      store.changeRoute('stream', { q: 'some-query' });
      assert.equal(store.route(), 'stream');
      assert.deepEqual(store.routeParams(), { q: 'some-query' });
    });
  });
});
