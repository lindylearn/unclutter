import { SelectionObserver } from '../selection-observer';

class FakeDocument extends EventTarget {
  constructor() {
    super();
    this.selection = null;
  }

  getSelection() {
    return this.selection;
  }
}

describe('SelectionObserver', () => {
  let clock;
  let fakeDocument;
  let range;
  let observer;
  let onSelectionChanged;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    fakeDocument = new FakeDocument();
    onSelectionChanged = sinon.stub();

    range = { collapsed: false };
    fakeDocument.selection = {
      rangeCount: 1,
      getRangeAt: function (index) {
        return index === 0 ? range : null;
      },
    };

    observer = new SelectionObserver(range => {
      onSelectionChanged(range);
    }, fakeDocument);

    // Move the clock forwards past the initial event.
    clock.tick(10);
    onSelectionChanged.reset();
  });

  afterEach(() => {
    observer.disconnect();
    clock.restore();
  });

  it('invokes callback when mouseup occurs', () => {
    fakeDocument.dispatchEvent(new Event('mouseup'));
    clock.tick(20);
    assert.calledWith(onSelectionChanged, range);
  });

  it('invokes callback with initial selection', () => {
    const onInitialSelection = sinon.stub();
    const observer = new SelectionObserver(onInitialSelection, fakeDocument);
    clock.tick(10);
    assert.called(onInitialSelection);
    observer.disconnect();
  });

  describe('when the selection changes', () => {
    it('invokes callback if mouse is not down', () => {
      fakeDocument.dispatchEvent(new Event('selectionchange'));
      clock.tick(200);
      assert.calledWith(onSelectionChanged, range);
    });

    it('does not invoke callback if mouse is down', () => {
      fakeDocument.dispatchEvent(new Event('mousedown'));
      fakeDocument.dispatchEvent(new Event('selectionchange'));
      clock.tick(200);
      assert.notCalled(onSelectionChanged);
    });

    it('does not invoke callback until there is a pause since the last change', () => {
      fakeDocument.dispatchEvent(new Event('selectionchange'));
      clock.tick(90);
      fakeDocument.dispatchEvent(new Event('selectionchange'));
      clock.tick(90);
      assert.notCalled(onSelectionChanged);
      clock.tick(20);
      assert.called(onSelectionChanged);
    });
  });
});
