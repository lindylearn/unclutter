import { confirm } from '../prompts';

describe('shared/prompts', () => {
  describe('confirm', () => {
    function clickClose() {
      const closeButton = getCustomDialog().querySelector(
        '[aria-label="Close"]'
      );
      closeButton.click();
    }

    function clickCancel() {
      const cancelButton = getCustomDialog().querySelector(
        '[data-testid="cancel-button"]'
      );
      cancelButton.click();
    }

    function clickConfirm() {
      const confirmButton = getCustomDialog().querySelector(
        '[data-testid="confirm-button"]'
      );
      confirmButton.click();
    }

    function getCustomDialog() {
      return document.querySelector('[data-testid="confirm-container"]');
    }

    it('renders a custom dialog', async () => {
      const result = confirm({
        title: 'Confirm action?',
        message: 'Do the thing?',
        confirmAction: 'Yeah!',
      });
      const dialog = getCustomDialog();

      assert.ok(dialog);

      clickClose();

      assert.notOk(getCustomDialog());
      assert.isFalse(await result);
    });

    it('returns true if "Confirm" button is clicked', async () => {
      const result = confirm({ message: 'Do the thing?' });
      clickConfirm();
      assert.isTrue(await result);
    });

    it('returns false if "Cancel" button is clicked', async () => {
      const result = confirm({ message: 'Do the thing?' });
      clickCancel();
      assert.isFalse(await result);
    });
  });
});
