import { mount } from 'enzyme';
import { act } from 'preact/test-utils';

import { createStore, createStoreModule } from '../create-store';
import { useStoreProxy, $imports } from '../use-store';

// Store module for use with `createStore` in tests.
const initialState = () => ({ things: [] });
const thingsModule = createStoreModule(initialState, {
  namespace: 'things',

  reducers: {
    ADD_THING(state, action) {
      if (state.things.some(t => t.id === action.thing.id)) {
        return {};
      }
      return { things: [...state.things, action.thing] };
    },
  },

  actionCreators: {
    addThing(id) {
      return { type: 'ADD_THING', thing: { id } };
    },
  },

  selectors: {
    thingCount(state) {
      return state.things.length;
    },

    getThing(state, id) {
      return state.things.find(t => t.id === id);
    },
  },
});

describe('sidebar/store/use-store', () => {
  afterEach(() => {
    $imports.$restore();
  });

  describe('useStoreProxy', () => {
    let store;
    let renderCount;

    beforeEach(() => {
      renderCount = 0;
      store = createStore([thingsModule]);

      store.addThing('foo');
      store.addThing('bar');

      $imports.$mock({
        '../service-context': {
          useService: name => (name === 'store' ? store : null),
        },
      });
    });

    function renderTestComponent() {
      let proxy;

      const TestComponent = () => {
        ++renderCount;
        proxy = useStoreProxy();

        return <div>{proxy.thingCount()}</div>;
      };

      const wrapper = mount(<TestComponent />);
      return { proxy, wrapper };
    }

    it('returns a proxy for the store', () => {
      const addThingSpy = sinon.spy(store, 'addThing');

      const { proxy } = renderTestComponent();

      // Test proxied selector method.
      assert.deepEqual(proxy.getThing('foo'), { id: 'foo' });
      assert.deepEqual(proxy.getThing('bar'), { id: 'bar' });

      // Test proxied action dispatch.
      proxy.addThing('baz');
      assert.calledWith(addThingSpy, 'baz');
    });

    it('proxies non-function properties of the store', () => {
      store.someString = 'foobar';

      const { proxy } = renderTestComponent();

      assert.equal(proxy.someString, 'foobar');
    });

    it('records and caches selector method calls', () => {
      const getThingSpy = sinon.spy(store, 'getThing');

      const { proxy } = renderTestComponent();

      proxy.getThing('foo');
      proxy.getThing('foo');

      assert.calledWith(getThingSpy, 'foo');
      assert.calledOnce(getThingSpy);
      getThingSpy.resetHistory();

      proxy.getThing('bar');
      proxy.getThing('bar');

      assert.calledWith(getThingSpy, 'bar');
      assert.calledOnce(getThingSpy);
    });

    it('does not cache action dispatches', () => {
      const addThingSpy = sinon.spy(store, 'addThing');

      const { proxy } = renderTestComponent();

      proxy.addThing('foo');
      proxy.addThing('foo');

      assert.calledTwice(addThingSpy);
      assert.calledWith(addThingSpy, 'foo');
    });

    context('after a store update', () => {
      it('clears cache and re-renders component if cache is invalid', () => {
        const { wrapper } = renderTestComponent();
        assert.equal(wrapper.text(), '2');
        assert.equal(renderCount, 1);

        // Dispatch an action which changes the store state used by the component.
        act(() => {
          store.addThing('baz');
        });
        wrapper.update();

        assert.equal(renderCount, 2);
        assert.equal(wrapper.text(), '3');
      });

      it('does not clear cache or re-render component if cache is still valid', () => {
        const { wrapper } = renderTestComponent();
        assert.equal(wrapper.text(), '2');
        assert.equal(renderCount, 1);

        // Dispatch an action which does not affect the store state used by the
        // component.
        act(() => {
          store.addThing('foo'); // nb. `foo` item already exists in store.
        });
        wrapper.update();

        assert.equal(renderCount, 1); // No re-render should happen.
        assert.equal(wrapper.text(), '2');
      });
    });

    it('unsubscribes from store when component is unmounted', () => {
      const { wrapper } = renderTestComponent();
      wrapper.unmount();

      // Trigger a store change after unmounting. It should not re-render the
      // component.
      act(() => {
        store.addThing('baz');
      });
      wrapper.update();

      assert.equal(renderCount, 1);
    });
  });
});
