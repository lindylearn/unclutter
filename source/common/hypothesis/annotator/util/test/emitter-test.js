import { EventBus } from '../emitter';

describe('Emitter', () => {
  it('subscribes and unsubscribes listeners and publishes events', () => {
    const eventBus = new EventBus();
    const emitterA = eventBus.createEmitter();
    const emitterB = eventBus.createEmitter();

    const callback = sinon.stub();
    emitterB.subscribe('someEvent', callback);
    emitterA.publish('someEvent', 'foo', 'bar');

    assert.calledOnce(callback);
    assert.calledWith(callback, 'foo', 'bar');

    emitterB.unsubscribe('someEvent', callback);
    emitterA.publish('someEvent', 'foo', 'bar');

    assert.calledOnce(callback);
  });

  it('fires events only to emitters using the same EventBus', () => {
    const emitterA = new EventBus().createEmitter();
    const emitterB = new EventBus().createEmitter();

    const callbackA = sinon.stub();
    const callbackB = sinon.stub();
    emitterA.subscribe('someEvent', callbackA);
    emitterB.subscribe('someEvent', callbackB);

    emitterA.publish('someEvent', 'foo', 'bar');
    emitterB.publish('someEvent', 1, 2);

    assert.calledOnce(callbackA);
    assert.calledWith(callbackA, 'foo', 'bar');

    assert.calledOnce(callbackB);
    assert.calledWith(callbackB, 1, 2);
  });

  it('removes all event listeners', () => {
    const emitter = new EventBus().createEmitter();
    const callback = sinon.stub();

    emitter.subscribe('someEvent', callback);
    emitter.publish('someEvent');
    assert.calledOnce(callback);

    emitter.destroy();
    emitter.publish('someEvent');
    assert.calledOnce(callback);
  });
});
