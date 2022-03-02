import { ListenerCollection } from '../listener-collection';

describe('ListenerCollection', () => {
  let listeners;

  beforeEach(() => {
    listeners = new ListenerCollection();
  });

  afterEach(() => {
    listeners.removeAll();
  });

  it('registers and triggers event listener', () => {
    const listener = sinon.stub();
    listeners.add(window, 'resize', listener);

    window.dispatchEvent(new Event('resize'));
    assert.calledOnce(listener);
  });

  it('unregisters event listeners', () => {
    const listener1 = sinon.stub();
    const listener2 = sinon.stub();
    listeners.add(window, 'resize', listener1);
    listeners.add(window, 'resize', listener2);
    listeners.removeAll();

    window.dispatchEvent(new Event('resize'));
    assert.notCalled(listener1);
    assert.notCalled(listener2);
  });
});
