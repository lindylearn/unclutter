/* eslint-disable no-console */

import * as redux from 'redux';

import debugMiddleware from '../debug-middleware';

function id(state) {
  return state;
}

describe('debug middleware', () => {
  let store;

  beforeEach(() => {
    sinon.stub(console, 'log');
    sinon.stub(console, 'group');
    sinon.stub(console, 'groupEnd');

    const enhancer = redux.applyMiddleware(debugMiddleware);
    store = redux.createStore(id, {}, enhancer);
  });

  afterEach(() => {
    console.log.restore();
    console.group.restore();
    console.groupEnd.restore();

    delete window.debug;
  });

  it('logs app state changes when "window.debug" is truthy', () => {
    window.debug = true;
    store.dispatch({ type: 'SOMETHING_HAPPENED' });
    assert.called(console.log);
  });

  it('logs nothing when "window.debug" is falsey', () => {
    store.dispatch({ type: 'SOMETHING_HAPPENED' });
    assert.notCalled(console.log);
  });
});
