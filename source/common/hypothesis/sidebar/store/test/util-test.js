import fakeStore from '../../test/fake-redux-store';

import * as util from '../util';

const fixtures = {
  update: {
    ADD_ANNOTATIONS: function (state, action) {
      if (!state.annotations) {
        return { annotations: action.annotations };
      }
      return { annotations: state.annotations.concat(action.annotations) };
    },
    SELECT_TAB: function (state, action) {
      return { tab: action.tab };
    },
  },
  selectors: {
    namespace1: {
      selectors: {
        countAnnotations1: localState => localState.annotations.length,
      },

      rootSelectors: {
        rootCountAnnotations1: rootState =>
          rootState.namespace1.annotations.length,
      },
    },
    namespace2: {
      selectors: {
        countAnnotations2: localState => localState.annotations.length,
      },

      rootSelectors: {
        rootCountAnnotations2: rootState =>
          rootState.namespace2.annotations.length,
      },
    },
  },
};

describe('sidebar/store/util', () => {
  describe('actionTypes', () => {
    it('returns an object with values equal to keys', () => {
      assert.deepEqual(
        util.actionTypes({
          SOME_ACTION: sinon.stub(),
          ANOTHER_ACTION: sinon.stub(),
        }),
        {
          SOME_ACTION: 'SOME_ACTION',
          ANOTHER_ACTION: 'ANOTHER_ACTION',
        }
      );
    });
  });

  describe('createReducer', () => {
    it('returns an object if input state is undefined', () => {
      // See redux.js:assertReducerShape in the "redux" package.
      const reducer = util.createReducer(fixtures.update);
      const initialState = reducer(undefined, {
        type: 'DUMMY_ACTION',
      });
      assert.isOk(initialState);
    });

    it('returns a reducer that combines each update function from the input object', () => {
      const reducer = util.createReducer(fixtures.update);
      const newState = reducer(
        {},
        {
          type: 'ADD_ANNOTATIONS',
          annotations: [{ id: 1 }],
        }
      );
      assert.deepEqual(newState, {
        annotations: [{ id: 1 }],
      });
    });

    it('returns a new object if the action was handled', () => {
      const reducer = util.createReducer(fixtures.update);
      const originalState = { someFlag: false };
      assert.notEqual(
        reducer(originalState, { type: 'SELECT_TAB', tab: 'notes' }),
        originalState
      );
    });

    it('returns the original object if the action was not handled', () => {
      const reducer = util.createReducer(fixtures.update);
      const originalState = { someFlag: false };
      assert.equal(
        reducer(originalState, { type: 'UNKNOWN_ACTION' }),
        originalState
      );
    });

    it('preserves state not modified by the update function', () => {
      const reducer = util.createReducer(fixtures.update);
      const newState = reducer(
        { otherFlag: false },
        {
          type: 'ADD_ANNOTATIONS',
          annotations: [{ id: 1 }],
        }
      );
      assert.deepEqual(newState, {
        otherFlag: false,
        annotations: [{ id: 1 }],
      });
    });

    it('supports reducer functions that return an array', () => {
      const action = {
        type: 'FIRST_ITEM',
        item: 'bar',
      };
      const addItem = {
        FIRST_ITEM(state, action) {
          // Concatenate the array with a new item.
          return [...state, action.item];
        },
      };
      const reducer = util.createReducer(addItem);
      const newState = reducer(['foo'], action);
      assert.equal(newState.length, 2);
    });
  });

  describe('bindSelectors', () => {
    it('binds selectors to current value of module state', () => {
      const getState = sinon.stub().returns({
        namespace1: {
          annotations: [{ id: 1 }],
        },
        namespace2: {
          annotations: [{ id: 2 }],
        },
      });
      const bound = util.bindSelectors(fixtures.selectors, getState);
      assert.equal(bound.countAnnotations1(), 1);
      assert.equal(bound.countAnnotations2(), 1);
    });

    it('binds root selectors to current value of root state', () => {
      const getState = sinon.stub().returns({
        namespace1: {
          annotations: [{ id: 1 }],
        },
        namespace2: {
          annotations: [{ id: 2 }],
        },
      });
      const bound = util.bindSelectors(fixtures.selectors, getState);
      assert.equal(bound.rootCountAnnotations1(), 1);
      assert.equal(bound.rootCountAnnotations2(), 1);
    });

    it('throws an error if selector names in different modules conflict', () => {
      const getState = () => ({});
      assert.throws(() => {
        util.bindSelectors(
          {
            moduleA: {
              selectors: { someSelector: () => {} },
            },
            moduleB: {
              selectors: { someSelector: () => {} },
            },
          },
          getState
        );
      }, 'Duplicate selector "someSelector"');
    });

    it('throws an error if selector names in different modules conflict', () => {
      const getState = () => ({});
      assert.throws(() => {
        util.bindSelectors(
          {
            moduleA: {
              selectors: { someSelector: () => {} },
              rootSelectors: { someSelector: () => {} },
            },
          },
          getState
        );
      });
    });
  });

  describe('awaitStateChange()', () => {
    let store;

    beforeEach(() => {
      store = fakeStore({
        fake: { val: 0 },
      });
    });

    function getValWhenGreaterThanTwo(store) {
      if (store.getState().val < 3) {
        return null;
      }
      return store.getState().val;
    }

    it('should return promise that resolves to a non-null value', () => {
      const expected = 5;
      store.setState({ val: 5 });
      return util
        .awaitStateChange(store, getValWhenGreaterThanTwo)
        .then(actual => {
          assert.equal(actual, expected);
        });
    });

    it('should wait for awaitStateChange to return a non-null value', () => {
      let valPromise;
      const expected = 5;

      store.setState({ val: 2 });
      valPromise = util.awaitStateChange(store, getValWhenGreaterThanTwo);
      store.setState({ val: 5 });

      return valPromise.then(actual => {
        assert.equal(actual, expected);
      });
    });
  });
});
