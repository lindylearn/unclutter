import { useEffect } from 'preact/hooks';
import { act } from 'preact/test-utils';

import Notebook, { $imports } from '../notebook';
import { EventBus } from '../util/emitter';

describe('Notebook', () => {
  // `Notebook` instances created by current test
  let notebooks;
  let container;
  let cleanUpCallback;

  const createNotebook = (config = {}) => {
    const eventBus = new EventBus();
    const notebook = new Notebook(container, eventBus, config);

    notebooks.push(notebook);

    return notebook;
  };

  beforeEach(() => {
    notebooks = [];
    container = document.createElement('div');
    cleanUpCallback = sinon.stub();

    const FakeNotebookModal = () => {
      useEffect(() => {
        return () => {
          cleanUpCallback();
        };
      }, []);
      return <div id="notebook-modal" />;
    };

    $imports.$mock({
      './components/NotebookModal': { default: FakeNotebookModal },
    });
  });

  afterEach(() => {
    notebooks.forEach(n => n.destroy());
    $imports.$restore();
  });

  describe('notebook container', () => {
    it('creates the container', () => {
      assert.isFalse(container.hasChildNodes());
      const notebook = createNotebook();
      const shadowRoot = notebook._outerContainer.shadowRoot;
      assert.isNotNull(shadowRoot);
      assert.isNotNull(shadowRoot.querySelector('#notebook-modal'));
    });

    it('removes the container', () => {
      const notebook = createNotebook();
      notebook.destroy();
      assert.isFalse(container.hasChildNodes());
    });

    it('calls the clean up function of the NotebookModal when the container is removed', () => {
      // Necessary to run the useEffect for first time and register the cleanup function
      let notebook;
      act(() => {
        notebook = createNotebook();
      });
      // Necessary to run the cleanup function of the useEffect
      act(() => {
        notebook.destroy();
      });
      assert.called(cleanUpCallback);
    });
  });
});
