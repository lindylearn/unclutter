import { getElementHeightWithMargins } from '../dom';

describe('sidebar/util/dom', () => {
  describe('getElementHeightWithMargins', () => {
    let theElement;

    beforeEach(() => {
      theElement = document.createElement('div');
      theElement.id = 'testElement';
      theElement.style.height = '450px';
      document.body.appendChild(theElement);
    });

    it("should return an element's height", () => {
      const testElement = document.getElementById('testElement');
      assert.equal(getElementHeightWithMargins(testElement), 450);
    });

    it('should include vertical margins', () => {
      const testElement = document.getElementById('testElement');
      testElement.style.marginTop = '10px';
      testElement.style.marginBottom = '10px';
      assert.equal(getElementHeightWithMargins(testElement), 470);
    });
  });
});
