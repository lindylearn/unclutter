import { offsetRelativeTo, scrollElement } from '../scroll';

describe('annotator/util/scroll', () => {
  let containers;

  beforeEach(() => {
    sinon.stub(window, 'requestAnimationFrame');
    window.requestAnimationFrame.yields();
    containers = [];
  });

  afterEach(() => {
    containers.forEach(c => c.remove());
    window.requestAnimationFrame.restore();
  });

  function createContainer() {
    const el = document.createElement('div');
    containers.push(el);
    document.body.append(el);
    return el;
  }

  describe('offsetRelativeTo', () => {
    it('returns the offset of an element relative to the given ancestor', () => {
      const parent = createContainer();
      parent.style.position = 'relative';

      const child = document.createElement('div');
      child.style.position = 'absolute';
      child.style.top = '100px';
      parent.append(child);

      const grandchild = document.createElement('div');
      grandchild.style.position = 'absolute';
      grandchild.style.top = '150px';
      child.append(grandchild);

      assert.equal(offsetRelativeTo(child, parent), 100);
      assert.equal(offsetRelativeTo(grandchild, parent), 250);
    });

    it('returns 0 if the parent is not an ancestor of the element', () => {
      const parent = document.createElement('div');
      const child = document.createElement('div');
      child.style.position = 'absolute';
      child.style.top = '100px';

      assert.equal(offsetRelativeTo(child, parent), 0);
    });
  });

  describe('scrollElement', () => {
    it("animates the element's `scrollTop` offset to the target position", async () => {
      const container = createContainer();
      container.style.overflow = 'scroll';
      container.style.width = '200px';
      container.style.height = '500px';
      container.style.position = 'relative';

      const child = document.createElement('div');
      child.style.height = '3000px';
      container.append(child);

      await scrollElement(container, 2000, { maxDuration: 5 });

      assert.equal(container.scrollTop, 2000);
      container.remove();
    });
  });
});
