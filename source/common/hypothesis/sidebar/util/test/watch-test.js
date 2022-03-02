import { createStore } from 'redux';

import { watch } from '../watch';

function counterReducer(state = { a: 0, b: 0, c: 0 }, action) {
  switch (action.type) {
    case 'INCREMENT_A':
      return { ...state, a: state.a + 1 };
    case 'INCREMENT_B':
      return { ...state, b: state.b + 1 };
    case 'INCREMENT_C':
      return { ...state, c: state.c + 1 };
    default:
      return state;
  }
}

describe('sidebar/util/watch', () => {
  /**
   * Create a Redux store as a data source for testing the `watch` function.
   */
  function counterStore() {
    return createStore(counterReducer);
  }

  describe('watch', () => {
    it('runs callback when computed value changes', () => {
      const callback = sinon.stub();
      const store = counterStore();

      watch(store.subscribe, () => store.getState().a, callback);

      store.dispatch({ type: 'INCREMENT_A' });
      assert.calledWith(callback, 1, 0);

      store.dispatch({ type: 'INCREMENT_A' });
      assert.calledWith(callback, 2, 1);
    });

    it('does not run callback if computed value did not change', () => {
      const callback = sinon.stub();
      const store = counterStore();

      watch(store.subscribe, () => store.getState().a, callback);
      store.dispatch({ type: 'INCREMENT_B' });

      assert.notCalled(callback);
    });

    it('compares watched values using strict equality', () => {
      const callback = sinon.stub();
      const store = counterStore();

      const newEmptyObject = () => ({});
      watch(store.subscribe, newEmptyObject, callback);

      store.dispatch({ type: 'INCREMENT_A' });
      store.dispatch({ type: 'INCREMENT_A' });

      // This will trigger the callback because we're comparing values by
      // strict equality rather than by shallow equality.
      assert.calledTwice(callback);
      assert.calledWith(callback, {});
    });

    it('runs callback if any of multiple watched values changes', () => {
      const callback = sinon.stub();
      const store = counterStore();

      watch(
        store.subscribe,
        [() => store.getState().a, () => store.getState().b],
        callback
      );

      // Dispatch action that changes the first watched value.
      store.dispatch({ type: 'INCREMENT_A' });
      assert.calledWith(callback, [1, 0], [0, 0]);

      // Dispatch action that changes the second watched value.
      callback.resetHistory();
      store.dispatch({ type: 'INCREMENT_B' });
      assert.calledWith(callback, [1, 1], [1, 0]);

      // Dispatch action that doesn't change either watched value.
      callback.resetHistory();
      store.dispatch({ type: 'INCREMENT_C' });
      assert.notCalled(callback);
    });

    it('returns unsubscription function', () => {
      const callback = sinon.stub();
      const store = counterStore();

      const unsubscribe = watch(
        store.subscribe,
        () => store.getState().a,
        callback
      );
      store.dispatch({ type: 'INCREMENT_A' });

      assert.calledWith(callback, 1, 0);

      callback.resetHistory();
      unsubscribe();
      store.dispatch({ type: 'INCREMENT_A' });

      assert.notCalled(callback);
    });
  });
});
