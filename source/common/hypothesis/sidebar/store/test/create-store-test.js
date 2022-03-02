/* global process */

import { createStore, createStoreModule } from '../create-store';

const A = 0;

function initialState(value = 0) {
  return { count: value };
}

const modules = [
  // namespaced module A
  createStoreModule(initialState, {
    namespace: 'a',

    reducers: {
      INCREMENT_COUNTER_A: (state, action) => {
        return { count: state.count + action.amount };
      },
      RESET: () => {
        return { count: 0 };
      },
    },

    actionCreators: {
      incrementA(amount) {
        return { type: 'INCREMENT_COUNTER_A', amount };
      },
    },

    selectors: {
      getCountA(state) {
        return state.count;
      },
    },

    rootSelectors: {
      getCountAFromRoot(state) {
        return state.a.count;
      },
    },
  }),

  // namespaced module B
  createStoreModule(initialState, {
    namespace: 'b',

    reducers: {
      INCREMENT_COUNTER_B: (state, action) => {
        return { count: state.count + action.amount };
      },
      RESET: () => {
        return { count: 0 };
      },
    },

    actionCreators: {
      incrementB(amount) {
        return { type: 'INCREMENT_COUNTER_B', amount };
      },
    },

    selectors: {
      getCountB(state) {
        return state.count;
      },
    },
  }),
];

function counterStore(initArgs = [], middleware = []) {
  return createStore(modules, initArgs, middleware);
}

describe('createStore', () => {
  it('returns a working Redux store', () => {
    const store = counterStore();
    assert.equal(store.getState().a.count, 0);
  });

  it('dispatches bound actions', () => {
    const store = counterStore();
    store.incrementA(5);
    assert.equal(store.getState().a.count, 5);
  });

  it('notifies subscribers when state changes', () => {
    const store = counterStore();
    const subscriber = sinon.spy(() => assert.equal(store.getCountA(), 1));

    store.subscribe(subscriber);
    store.incrementA(1);

    assert.calledWith(subscriber);
  });

  it('passes initial state args to `initialState` function', () => {
    const store = counterStore([21]);
    assert.equal(store.getState().a.count, 21);
  });

  it('adds actions as methods to the store', () => {
    const store = counterStore();
    store.incrementA(5);
    assert.equal(store.getState().a.count, 5);
  });

  it('adds selectors as methods to the store', () => {
    const store = counterStore();
    store.dispatch(modules[A].actionCreators.incrementA(5));
    assert.equal(store.getCountA(), 5);
  });

  it('adds root selectors as methods to the store', () => {
    const store = counterStore();
    store.dispatch(modules[A].actionCreators.incrementA(5));
    assert.equal(store.getCountAFromRoot(), 5);
  });

  it('applies `thunk` middleware by default', () => {
    const store = counterStore();
    const doubleAction = (dispatch, getState) => {
      dispatch(modules[A].actionCreators.incrementA(getState().a.count));
    };

    store.incrementA(5);
    store.dispatch(doubleAction);

    assert.equal(store.getCountA(), 10);
  });

  it('applies additional middleware', () => {
    const actions = [];
    const middleware = () => {
      return next => {
        return action => {
          actions.push(action);
          return next(action);
        };
      };
    };
    const store = counterStore([], [middleware]);

    store.incrementA(5);

    assert.deepEqual(actions, [{ type: 'INCREMENT_COUNTER_A', amount: 5 }]);
  });

  it('actions and selectors operate on their respective namespaced state', () => {
    const store = counterStore();
    store.incrementB(6);
    store.incrementA(5);
    assert.equal(store.getCountB(), 6);
    assert.equal(store.getCountA(), 5);
  });

  it('getState returns the top level root state', () => {
    const store = counterStore();
    store.incrementA(5);
    store.incrementB(6);
    assert.equal(store.getState().a.count, 5);
    assert.equal(store.getState().b.count, 6);
  });

  it('action can be handled across multiple reducers', () => {
    const store = counterStore();
    store.incrementA(1);
    store.incrementB(1);
    store.dispatch({
      type: 'RESET',
    });
    assert.equal(store.getState().a.count, 0);
    assert.equal(store.getState().b.count, 0);
  });

  it('supports modules with static initial state', () => {
    const initialState = { value: 42 };
    const module = createStoreModule(initialState, {
      namespace: 'test',
      actionCreators: {},
      reducers: {},
      selectors: {},
    });
    const store = createStore([module]);
    assert.equal(store.getState().test.value, 42);
  });

  if (process.env.NODE_ENV !== 'production') {
    it('freezes store state in development builds', () => {
      const store = counterStore();
      assert.throws(() => {
        store.getState().a.count = 1;
      }, /Cannot assign to read only property/);
    });
  }
});
