import { createStore } from '../../create-store';
import toastMessages from '../toast-messages';

describe('store/modules/toast-messages', () => {
  let store;
  let fakeToastMessage;

  beforeEach(() => {
    store = createStore([toastMessages]);
    fakeToastMessage = {
      id: 'myToast',
      type: 'anyType',
      message: 'This is a message',
    };
  });

  describe('actions', () => {
    describe('addToastMessage', () => {
      it('adds the provided object to the array of messages in state', () => {
        store.addToastMessage(fakeToastMessage);

        const messages = store.getToastMessages();

        assert.lengthOf(messages, 1);
        // These two objects should not have the same reference
        assert.notEqual(messages[0], fakeToastMessage);
        assert.equal(messages[0].id, 'myToast');
        assert.equal(messages[0].type, 'anyType');
        assert.equal(messages[0].message, 'This is a message');
      });

      it('adds duplicate messages to the array of messages in state', () => {
        // This store module doesn't care about duplicates
        store.addToastMessage(fakeToastMessage);
        store.addToastMessage(fakeToastMessage);

        const messages = store.getToastMessages();

        assert.lengthOf(messages, 2);
        assert.notEqual(messages[0], messages[1]);
      });
    });

    describe('removeToastMessage', () => {
      it('removes messages that match the provided id', () => {
        store.addToastMessage(fakeToastMessage);
        fakeToastMessage.id = 'myToast2';
        store.addToastMessage(fakeToastMessage);

        store.removeToastMessage('myToast2');
        const messages = store.getToastMessages();

        assert.lengthOf(messages, 1);
        assert.equal(messages[0].id, 'myToast');
      });

      it('should not remove any objects if none match the provided id', () => {
        store.addToastMessage(fakeToastMessage);
        fakeToastMessage.id = 'myToast2';
        store.addToastMessage(fakeToastMessage);

        store.removeToastMessage('myToast3');

        assert.lengthOf(store.getToastMessages(), 2);
      });
    });

    describe('updateToastMessage', () => {
      it('should update the message object', () => {
        const updatedMessage = {
          id: 'myToast',
          type: 'whatever',
          message: 'updated',
        };
        store.addToastMessage(fakeToastMessage);
        store.updateToastMessage(updatedMessage);

        assert.deepEqual(store.getToastMessage('myToast'), updatedMessage);
      });

      it('should be OK if there is no matching message object', () => {
        store.addToastMessage(fakeToastMessage);
        store.updateToastMessage({ id: 'random' });

        assert.lengthOf(store.getToastMessages(), 1);
      });
    });
  });

  describe('selectors', () => {
    describe('getToastMessage', () => {
      it('should return message with matching `id`', () => {
        const anotherMessage = { ...fakeToastMessage, id: 'thisOne' };
        store.addToastMessage(fakeToastMessage);
        store.addToastMessage(anotherMessage);

        const retrievedMessage = store.getToastMessage('thisOne');

        assert.deepEqual(retrievedMessage, anotherMessage);
      });

      it('should return `undefined` if no message matches', () => {
        store.addToastMessage(fakeToastMessage);

        assert.isUndefined(store.getToastMessage('someRandomId'));
      });
    });

    describe('getToastMessages', () => {
      it('should return its collection of messages', () => {
        assert.isArray(store.getToastMessages());
      });
    });

    describe('hasToastMessage', () => {
      it('should return `true` if one message matches `type` and `state`', () => {
        store.addToastMessage(fakeToastMessage);
        fakeToastMessage.type = 'anotherType';
        store.addToastMessage(fakeToastMessage);

        assert.isTrue(store.hasToastMessage('anyType', 'This is a message'));
      });

      it('should return `true` if more than one message matches `type` and `state`', () => {
        store.addToastMessage(fakeToastMessage);
        store.addToastMessage(fakeToastMessage);

        assert.isTrue(store.hasToastMessage('anyType', 'This is a message'));
      });

      it('should return `false` if no messages match both `type` and `state`', () => {
        store.addToastMessage(fakeToastMessage);

        assert.isFalse(
          store.hasToastMessage('anotherType', 'This is a message')
        );
        assert.isFalse(
          store.hasToastMessage('anyType', 'This is another message')
        );
      });
    });
  });
});
