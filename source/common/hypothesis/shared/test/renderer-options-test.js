import { createElement } from 'preact';
import { setupBrowserFixes } from '../renderer-options';

describe('shared/renderer-options', () => {
  describe('setupBrowserFixes', () => {
    let fakeOptions;
    let prevHook;

    beforeEach(() => {
      prevHook = sinon.stub();
      fakeOptions = {
        vnode: undefined,
      };
    });

    context('when all checks pass', () => {
      it('does not set a new vnode option', () => {
        setupBrowserFixes(fakeOptions);
        assert.isNotOk(fakeOptions.vnode);
      });
    });

    context('when `dir = "auto"` check fails', () => {
      beforeEach(() => {
        const fakeElement = {
          set dir(value) {
            if (value === 'auto') {
              throw new Error('Invalid argument');
            }
          },
        };
        sinon.stub(document, 'createElement').returns(fakeElement);
      });

      afterEach(() => {
        document.createElement.restore();
      });

      it('sets a new vnode option', () => {
        setupBrowserFixes(fakeOptions);
        assert.isOk(fakeOptions.vnode);
      });

      it('does not override an existing option if one exists', () => {
        fakeOptions.vnode = prevHook;
        setupBrowserFixes(fakeOptions);
        fakeOptions.vnode({});
        assert.called(prevHook);
      });

      it("alters the `dir` attribute when its equal to 'auto'", () => {
        setupBrowserFixes(fakeOptions);
        const vDiv = createElement('div', { dir: 'auto' }, 'text');
        fakeOptions.vnode(vDiv);
        assert.equal(vDiv.props.dir, '');
      });

      it('does not alter the `dir` attribute when vnode.type is not a string', () => {
        setupBrowserFixes(fakeOptions);
        const vDiv = createElement('div', { dir: 'auto' }, 'text');
        vDiv.type = () => {}; // force it to be a function
        fakeOptions.vnode(vDiv);
        assert.equal(vDiv.props.dir, 'auto');
      });

      it("does not alter the `dir` attribute when its value is not 'auto'", () => {
        setupBrowserFixes(fakeOptions);
        const vDiv = createElement('function', { dir: 'ltr' }, 'text');
        fakeOptions.vnode(vDiv);
        assert.equal(vDiv.props.dir, 'ltr');
      });
    });
  });
});
