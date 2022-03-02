import Guest from '../guest';
import { EventBus } from '../util/emitter';
import { $imports } from '../guest';

class FakeAdder {
  constructor(container, options) {
    FakeAdder.instance = this;

    this.hide = sinon.stub();
    this.show = sinon.stub();
    this.destroy = sinon.stub();
    this.options = options;
  }
}
FakeAdder.instance = null;

class FakeTextRange {
  constructor(range) {
    this.range = range;
  }

  toRange() {
    return this.range;
  }

  static fromRange(range) {
    return new FakeTextRange(range);
  }
}

describe('Guest', () => {
  const sandbox = sinon.createSandbox();
  let eventBus;
  let highlighter;
  let rangeUtil;
  let notifySelectionChanged;

  let CrossFrame;
  let fakeCrossFrame;

  let HTMLIntegration;
  let fakeHTMLIntegration;

  let PDFIntegration;
  let fakePDFIntegration;
  let guests;

  const createGuest = (config = {}) => {
    const element = document.createElement('div');
    eventBus = new EventBus();
    const guest = new Guest(element, eventBus, config);
    guests.push(guest);
    return guest;
  };

  beforeEach(() => {
    guests = [];
    FakeAdder.instance = null;
    highlighter = {
      getHighlightsContainingNode: sinon.stub().returns([]),
      highlightRange: sinon.stub().returns([]),
      removeHighlights: sinon.stub(),
      removeAllHighlights: sinon.stub(),
      setHighlightsFocused: sinon.stub(),
      setHighlightsVisible: sinon.stub(),
    };
    rangeUtil = {
      itemsForRange: sinon.stub().returns([]),
      isSelectionBackwards: sinon.stub(),
      selectionFocusRect: sinon.stub(),
    };
    notifySelectionChanged = null;

    fakeCrossFrame = {
      onConnect: sinon.stub(),
      on: sinon.stub(),
      call: sinon.stub(),
      sync: sinon.stub(),
      destroy: sinon.stub(),
    };
    CrossFrame = sandbox.stub().returns(fakeCrossFrame);

    fakeHTMLIntegration = {
      anchor: sinon.stub(),
      contentContainer: sinon.stub().returns({}),
      describe: sinon.stub(),
      destroy: sinon.stub(),
      fitSideBySide: sinon.stub(),
      getMetadata: sinon.stub().resolves({ title: 'Test title' }),
      scrollToAnchor: sinon.stub().resolves(),
      uri: sinon.stub().resolves('https://example.com/test.html'),
    };
    HTMLIntegration = sinon.stub().returns(fakeHTMLIntegration);

    fakePDFIntegration = {
      contentContainer: sinon.stub().returns({}),
      destroy: sinon.stub(),
      fitSideBySide: sinon.stub().returns(false),
      getMetadata: sinon
        .stub()
        .resolves({ documentFingerprint: 'test-fingerprint' }),
      scrollToAnchor: sinon.stub().resolves(),
      uri: sinon.stub().resolves('https://example.com/test.pdf'),
    };
    PDFIntegration = sinon.stub().returns(fakePDFIntegration);

    class FakeSelectionObserver {
      constructor(callback) {
        notifySelectionChanged = callback;
        this.disconnect = sinon.stub();
      }
    }

    $imports.$mock({
      './adder': { Adder: FakeAdder },
      './anchoring/text-range': {
        TextRange: FakeTextRange,
      },
      './integrations/html': { HTMLIntegration },
      './integrations/pdf': { PDFIntegration },
      './highlighter': highlighter,
      './range-util': rangeUtil,
      './cross-frame': { CrossFrame },
      './selection-observer': {
        SelectionObserver: FakeSelectionObserver,
      },
    });
  });

  afterEach(() => {
    guests.forEach(guest => guest.destroy());
    sandbox.restore();
    $imports.$restore();
  });

  describe('cross frame', () => {
    it('provides an event bus for the annotation sync module', () => {
      createGuest();
      assert.deepEqual(CrossFrame.lastCall.args[1], eventBus);
    });

    it('publishes the "panelReady" event when a connection is established', () => {
      const handler = sandbox.stub();
      const guest = createGuest();
      guest._emitter.subscribe('panelReady', handler);
      fakeCrossFrame.onConnect.yield();
      assert.called(handler);
    });

    describe('event subscription', () => {
      let emitter;
      let guest;

      beforeEach(() => {
        guest = createGuest();
        emitter = eventBus.createEmitter();
      });

      afterEach(() => {
        emitter.destroy();
      });

      it('proxies the event into the annotator event system', () => {
        const fooHandler = sandbox.stub();
        const barHandler = sandbox.stub();

        emitter.subscribe('foo', fooHandler);
        emitter.subscribe('bar', barHandler);

        guest._emitter.publish('foo', '1', '2');
        guest._emitter.publish('bar', '1', '2');

        assert.calledWith(fooHandler, '1', '2');
        assert.calledWith(barHandler, '1', '2');
      });
    });

    describe('event publication', () => {
      let emitter;
      let guest;

      beforeEach(() => {
        guest = createGuest();
        emitter = eventBus.createEmitter();
      });

      it('detaches annotations on "annotationDeleted"', () => {
        const ann = { id: 1, $tag: 'tag1' };
        sandbox.stub(guest, 'detach');
        emitter.publish('annotationDeleted', ann);
        assert.calledOnce(guest.detach);
        assert.calledWith(guest.detach, ann);
      });

      it('anchors annotations on "annotationsLoaded"', () => {
        const ann1 = { id: 1, $tag: 'tag1' };
        const ann2 = { id: 2, $tag: 'tag2' };
        sandbox.stub(guest, 'anchor');
        emitter.publish('annotationsLoaded', [ann1, ann2]);
        assert.calledTwice(guest.anchor);
        assert.calledWith(guest.anchor, ann1);
        assert.calledWith(guest.anchor, ann2);
      });

      it('proxies all other events into the annotator event system', () => {
        const fooHandler = sandbox.stub();
        const barHandler = sandbox.stub();

        guest._emitter.subscribe('foo', fooHandler);
        guest._emitter.subscribe('bar', barHandler);

        emitter.publish('foo', '1', '2');
        emitter.publish('bar', '1', '2');

        assert.calledWith(fooHandler, '1', '2');
        assert.calledWith(barHandler, '1', '2');
      });
    });
  });

  describe('events from sidebar', () => {
    const emitGuestEvent = (event, ...args) => {
      for (let [evt, fn] of fakeCrossFrame.on.args) {
        if (event === evt) {
          fn(...args);
        }
      }
    };

    describe('on "focusAnnotations" event', () => {
      it('focuses any annotations with a matching tag', () => {
        const highlight0 = document.createElement('span');
        const highlight1 = document.createElement('span');
        const guest = createGuest();
        guest.anchors = [
          { annotation: { $tag: 'tag1' }, highlights: [highlight0] },
          { annotation: { $tag: 'tag2' }, highlights: [highlight1] },
        ];

        emitGuestEvent('focusAnnotations', ['tag1']);

        assert.calledWith(
          highlighter.setHighlightsFocused,
          guest.anchors[0].highlights,
          true
        );
      });

      it('unfocuses any annotations without a matching tag', () => {
        const highlight0 = document.createElement('span');
        const highlight1 = document.createElement('span');
        const guest = createGuest();
        guest.anchors = [
          { annotation: { $tag: 'tag1' }, highlights: [highlight0] },
          { annotation: { $tag: 'tag2' }, highlights: [highlight1] },
        ];

        emitGuestEvent('focusAnnotations', ['tag1']);

        assert.calledWith(
          highlighter.setHighlightsFocused,
          guest.anchors[1].highlights,
          false
        );
      });

      it('updates focused tag set', () => {
        const guest = createGuest();

        emitGuestEvent('focusAnnotations', ['tag1']);
        emitGuestEvent('focusAnnotations', ['tag2', 'tag3']);

        assert.deepEqual([...guest.focusedAnnotationTags], ['tag2', 'tag3']);
      });
    });

    describe('on "scrollToAnnotation" event', () => {
      it('scrolls to the anchor with the matching tag', () => {
        const highlight = document.createElement('span');
        const guest = createGuest();
        const fakeRange = sinon.stub();
        guest.anchors = [
          {
            annotation: { $tag: 'tag1' },
            highlights: [highlight],
            range: new FakeTextRange(fakeRange),
          },
        ];

        emitGuestEvent('scrollToAnnotation', 'tag1');

        assert.called(fakeHTMLIntegration.scrollToAnchor);
        assert.calledWith(fakeHTMLIntegration.scrollToAnchor, guest.anchors[0]);
      });

      it('emits a "scrolltorange" DOM event', () => {
        const highlight = document.createElement('span');
        const guest = createGuest();
        const fakeRange = sinon.stub();
        guest.anchors = [
          {
            annotation: { $tag: 'tag1' },
            highlights: [highlight],
            range: new FakeTextRange(fakeRange),
          },
        ];

        return new Promise(resolve => {
          guest.element.addEventListener('scrolltorange', event => {
            assert.equal(event.detail, fakeRange);
            resolve();
          });

          emitGuestEvent('scrollToAnnotation', 'tag1');
        });
      });

      it('allows the default scroll behaviour to be prevented', () => {
        const highlight = document.createElement('span');
        const guest = createGuest();
        const fakeRange = sandbox.stub();
        guest.anchors = [
          {
            annotation: { $tag: 'tag1' },
            highlights: [highlight],
            range: new FakeTextRange(fakeRange),
          },
        ];
        guest.element.addEventListener('scrolltorange', event =>
          event.preventDefault()
        );

        emitGuestEvent('scrollToAnnotation', 'tag1');

        assert.notCalled(fakeHTMLIntegration.scrollToAnchor);
      });

      it('does nothing if the anchor has no highlights', () => {
        const guest = createGuest();

        guest.anchors = [{ annotation: { $tag: 'tag1' } }];
        emitGuestEvent('scrollToAnnotation', 'tag1');

        assert.notCalled(fakeHTMLIntegration.scrollToAnchor);
      });

      it("does nothing if the anchor's range cannot be resolved", () => {
        const highlight = document.createElement('span');
        const guest = createGuest();
        guest.anchors = [
          {
            annotation: { $tag: 'tag1' },
            highlights: [highlight],
            range: {
              toRange: sandbox.stub().throws(new Error('Something went wrong')),
            },
          },
        ];
        const eventEmitted = sandbox.stub();
        guest.element.addEventListener('scrolltorange', eventEmitted);

        emitGuestEvent('scrollToAnnotation', 'tag1');

        assert.notCalled(eventEmitted);
        assert.notCalled(fakeHTMLIntegration.scrollToAnchor);
      });
    });

    describe('on "getDocumentInfo" event', () => {
      let guest;

      afterEach(() => {
        guest.destroy();
        sandbox.restore();
      });

      function createCallback(expectedUri, expectedMetadata, done) {
        return (err, result) => {
          assert.strictEqual(err, null);
          try {
            assert.equal(result.uri, expectedUri);
            assert.deepEqual(result.metadata, expectedMetadata);
            done();
          } catch (e) {
            done(e);
          }
        };
      }

      context('in an HTML document', () => {
        it('calls the callback with HTML URL and metadata', done => {
          fakeHTMLIntegration.uri.resolves('https://example.com/');
          const metadata = { title: 'Example site' };
          fakeHTMLIntegration.getMetadata.resolves(metadata);

          guest = createGuest();

          emitGuestEvent(
            'getDocumentInfo',
            createCallback('https://example.com/', metadata, done)
          );
        });
      });

      context('in a PDF document', () => {
        it('calls the callback with PDF URL and metadata', done => {
          guest = createGuest({ documentType: 'pdf' });
          const metadata = { title: 'hi' };

          fakePDFIntegration.getMetadata.resolves(metadata);

          emitGuestEvent(
            'getDocumentInfo',
            createCallback('https://example.com/test.pdf', metadata, done)
          );
        });
      });
    });

    describe('on "setVisibleHighlights" event', () => {
      it('sets visibility of highlights in document', () => {
        const guest = createGuest();

        emitGuestEvent('setVisibleHighlights', true);
        assert.calledWith(
          highlighter.setHighlightsVisible,
          guest.element,
          true
        );

        emitGuestEvent('setVisibleHighlights', false);
        assert.calledWith(
          highlighter.setHighlightsVisible,
          guest.element,
          false
        );
      });
    });
  });

  describe('document events', () => {
    let fakeHighlight;
    let fakeSidebarFrame;
    let guest;
    let rootElement;

    beforeEach(() => {
      fakeSidebarFrame = null;
      guest = createGuest();
      guest.setVisibleHighlights(true);
      rootElement = guest.element;

      // Create a fake highlight as a target for hover and click events.
      fakeHighlight = document.createElement('hypothesis-highlight');
      const annotation = { $tag: 'highlight-ann-tag' };
      highlighter.getHighlightsContainingNode
        .withArgs(fakeHighlight)
        .returns([{ _annotation: annotation }]);

      // Guest relies on event listeners on the root element, so all highlights must
      // be descendants of it.
      rootElement.appendChild(fakeHighlight);
    });

    afterEach(() => {
      fakeSidebarFrame?.remove();
    });

    it('hides sidebar on user "mousedown" or "touchstart" events in the document', () => {
      for (let event of ['mousedown', 'touchstart']) {
        rootElement.dispatchEvent(new Event(event));
        assert.calledWith(guest.crossframe.call, 'closeSidebar');
        guest.crossframe.call.resetHistory();
      }
    });

    it('does not hide sidebar if side-by-side mode is active', () => {
      for (let event of ['mousedown', 'touchstart']) {
        // Activate side-by-side mode
        fakeHTMLIntegration.fitSideBySide.returns(true);
        guest.fitSideBySide({ expanded: true, width: 100 });

        rootElement.dispatchEvent(new Event(event));

        assert.notCalled(guest.crossframe.call);
        guest.crossframe.call.resetHistory();
      }
    });

    it('does not reposition the adder on window "resize" event if the adder is hidden', () => {
      sandbox.stub(guest, '_repositionAdder').callThrough();
      sandbox.stub(guest, '_onSelection'); // Calling _onSelect makes the adder to reposition

      window.dispatchEvent(new Event('resize'));

      assert.called(guest._repositionAdder);
      assert.notCalled(guest._onSelection);
    });

    it('reposition the adder on window "resize" event if the adder is shown', () => {
      sandbox.stub(guest, '_repositionAdder').callThrough();
      sandbox.stub(guest, '_onSelection'); // Calling _onSelect makes the adder to reposition

      guest._isAdderVisible = true;
      sandbox.stub(window, 'getSelection').returns({ getRangeAt: () => true });

      window.dispatchEvent(new Event('resize'));

      assert.called(guest._onSelection);
    });

    it('focuses annotations in the sidebar when hovering highlights in the document', () => {
      // Hover the highlight
      fakeHighlight.dispatchEvent(new Event('mouseover', { bubbles: true }));
      assert.calledWith(highlighter.getHighlightsContainingNode, fakeHighlight);
      assert.calledWith(fakeCrossFrame.call, 'focusAnnotations', [
        'highlight-ann-tag',
      ]);

      // Un-hover the highlight
      fakeHighlight.dispatchEvent(new Event('mouseout', { bubbles: true }));
      assert.calledWith(fakeCrossFrame.call, 'focusAnnotations', []);
    });

    it('does not focus annotations in the sidebar when a non-highlight element is hovered', () => {
      rootElement.dispatchEvent(new Event('mouseover', { bubbles: true }));

      assert.calledWith(highlighter.getHighlightsContainingNode, rootElement);
      assert.notCalled(fakeCrossFrame.call);
    });

    it('does not focus or select annotations in the sidebar if highlights are hidden', () => {
      guest.setVisibleHighlights(false);

      fakeHighlight.dispatchEvent(new Event('mouseover', { bubbles: true }));
      fakeHighlight.dispatchEvent(new Event('mouseup', { bubbles: true }));

      assert.calledWith(highlighter.getHighlightsContainingNode, fakeHighlight);
      assert.notCalled(fakeCrossFrame.call);
    });

    it('selects annotations in the sidebar when clicking on a highlight', () => {
      fakeHighlight.dispatchEvent(new Event('mouseup', { bubbles: true }));

      assert.calledWith(fakeCrossFrame.call, 'showAnnotations', [
        'highlight-ann-tag',
      ]);
      assert.calledWith(fakeCrossFrame.call, 'openSidebar');
    });

    it('toggles selected annotations in the sidebar when Ctrl/Cmd-clicking a highlight', () => {
      fakeHighlight.dispatchEvent(
        new MouseEvent('mouseup', { bubbles: true, ctrlKey: true })
      );

      assert.calledWith(fakeCrossFrame.call, 'toggleAnnotationSelection', [
        'highlight-ann-tag',
      ]);
      assert.calledWith(fakeCrossFrame.call, 'openSidebar');
    });
  });

  describe('when the selection changes', () => {
    let container;

    beforeEach(() => {
      container = document.createElement('div');
      container.innerHTML = 'test text';
      document.body.appendChild(container);
      window.getSelection().selectAllChildren(container);
    });

    afterEach(() => {
      container.remove();
    });

    const simulateSelectionWithText = () => {
      rangeUtil.selectionFocusRect.returns({
        left: 0,
        top: 0,
        width: 5,
        height: 5,
      });
      notifySelectionChanged({});
    };

    const simulateSelectionWithoutText = () => {
      rangeUtil.selectionFocusRect.returns(null);
      notifySelectionChanged({});
    };

    it('shows the adder if the selection contains text', () => {
      createGuest();
      simulateSelectionWithText();
      assert.called(FakeAdder.instance.show);
    });

    it('sets the annotations associated with the selection', () => {
      createGuest();
      const ann = {};
      container._annotation = ann;
      rangeUtil.itemsForRange.callsFake((range, callback) => [
        callback(range.startContainer),
      ]);
      simulateSelectionWithText();

      assert.deepEqual(FakeAdder.instance.annotationsForSelection, [ann]);
    });

    it('hides the adder if the selection does not contain text', () => {
      createGuest();

      simulateSelectionWithoutText();

      assert.called(FakeAdder.instance.hide);
      assert.notCalled(FakeAdder.instance.show);
    });

    it('hides the adder if the selection is empty', () => {
      createGuest();
      notifySelectionChanged(null);
      assert.called(FakeAdder.instance.hide);
    });

    it('emits `hasSelectionChanged` event with argument `true` if selection is non-empty', () => {
      const guest = createGuest();
      const callback = sandbox.stub();
      guest._emitter.subscribe('hasSelectionChanged', callback);

      simulateSelectionWithText();

      assert.calledWith(callback, true);
    });

    it('emits `hasSelectionChanged` event with argument `false` if selection is empty', () => {
      const guest = createGuest();
      const callback = sandbox.stub();
      guest._emitter.subscribe('hasSelectionChanged', callback);

      simulateSelectionWithoutText();

      assert.calledWith(callback, false);
    });
  });

  describe('when adder toolbar buttons are clicked', () => {
    // nb. Detailed tests for properties of new annotations are in the
    // `createAnnotation` tests.
    it('creates a new annotation if "Annotate" is clicked', async () => {
      const guest = createGuest();
      const callback = sandbox.stub();
      guest._emitter.subscribe('beforeAnnotationCreated', callback);

      await FakeAdder.instance.options.onAnnotate();

      assert.called(callback);
    });

    it('creates a new highlight if "Highlight" is clicked', async () => {
      const guest = createGuest();
      const callback = sandbox.stub();
      guest._emitter.subscribe('beforeAnnotationCreated', callback);

      await FakeAdder.instance.options.onHighlight();

      assert.calledWith(callback, sinon.match({ $highlight: true }));
    });

    it('shows annotations if "Show" is clicked', () => {
      createGuest();

      FakeAdder.instance.options.onShowAnnotations([{ $tag: 'ann1' }]);

      assert.calledWith(fakeCrossFrame.call, 'openSidebar');
      assert.calledWith(fakeCrossFrame.call, 'showAnnotations', ['ann1']);
    });
  });

  describe('#selectAnnotations', () => {
    it('selects the specified annotations in the sidebar', () => {
      const guest = createGuest();
      const annotations = [{ $tag: 'ann1' }, { $tag: 'ann2' }];

      guest.selectAnnotations(annotations);

      assert.calledWith(fakeCrossFrame.call, 'showAnnotations', [
        'ann1',
        'ann2',
      ]);
    });

    it('toggles the annotations if `toggle` is true', () => {
      const guest = createGuest();
      const annotations = [{ $tag: 'ann1' }, { $tag: 'ann2' }];

      guest.selectAnnotations(annotations, true /* toggle */);

      assert.calledWith(fakeCrossFrame.call, 'toggleAnnotationSelection', [
        'ann1',
        'ann2',
      ]);
    });

    it('opens the sidebar', () => {
      const guest = createGuest();

      guest.selectAnnotations([]);

      assert.calledWith(fakeCrossFrame.call, 'openSidebar');
    });
  });

  describe('#scrollToAnchor', () => {
    it("invokes the document integration's `scrollToAnchor` implementation", () => {
      const guest = createGuest();
      const anchor = {};

      guest.scrollToAnchor(anchor);

      assert.calledWith(fakeHTMLIntegration.scrollToAnchor, anchor);
    });
  });

  describe('#getDocumentInfo', () => {
    let guest;

    beforeEach(() => {
      guest = createGuest();
    });

    it('preserves the components of the URI other than the fragment', () => {
      fakeHTMLIntegration.uri.resolves('http://foobar.com/things?id=42');
      return guest
        .getDocumentInfo()
        .then(({ uri }) => assert.equal(uri, 'http://foobar.com/things?id=42'));
    });

    it('removes the fragment identifier from URIs', () => {
      fakeHTMLIntegration.uri.resolves(
        'http://foobar.com/things?id=42#ignoreme'
      );
      return guest
        .getDocumentInfo()
        .then(({ uri }) => assert.equal(uri, 'http://foobar.com/things?id=42'));
    });

    it('rejects if getting the URL fails', async () => {
      const guest = createGuest();
      fakeHTMLIntegration.uri.rejects(new Error('Failed to get URI'));
      await assert.rejects(guest.getDocumentInfo(), 'Failed to get URI');
    });

    it('rejects if getting the document metadata fails', async () => {
      const guest = createGuest();
      fakeHTMLIntegration.getMetadata.rejects(new Error('Failed to get URI'));
      await assert.rejects(guest.getDocumentInfo(), 'Failed to get URI');
    });
  });

  describe('#createAnnotation', () => {
    it('adds document metadata to the annotation', async () => {
      const guest = createGuest();

      const annotation = await guest.createAnnotation();

      assert.equal(annotation.uri, await fakeHTMLIntegration.uri());
      assert.deepEqual(
        annotation.document,
        await fakeHTMLIntegration.getMetadata()
      );
    });

    it('adds selectors for selected ranges to the annotation', async () => {
      const guest = createGuest();
      const fakeRange = {};
      guest.selectedRanges = [fakeRange];

      const selectorA = { type: 'TextPositionSelector', start: 0, end: 10 };
      const selectorB = { type: 'TextQuoteSelector', exact: 'foobar' };
      fakeHTMLIntegration.anchor.resolves({});
      fakeHTMLIntegration.describe.returns([selectorA, selectorB]);

      const annotation = await guest.createAnnotation({});

      assert.calledWith(fakeHTMLIntegration.describe, guest.element, fakeRange);
      assert.deepEqual(annotation.target, [
        {
          source: await fakeHTMLIntegration.uri(),
          selector: [selectorA, selectorB],
        },
      ]);
    });

    it('sets `$tag` to a falsey value', async () => {
      const guest = createGuest();
      const annotation = await guest.createAnnotation();
      assert.notOk(annotation.$tag);
    });

    it('sets falsey `$highlight` if `highlight` is false', async () => {
      const guest = createGuest();
      const annotation = await guest.createAnnotation();
      assert.notOk(annotation.$highlight);
    });

    it('sets `$highlight` to true if `highlight` is true', async () => {
      const guest = createGuest();
      const annotation = await guest.createAnnotation({ highlight: true });
      assert.equal(annotation.$highlight, true);
    });

    it('opens sidebar if `highlight` is false', async () => {
      const guest = createGuest();
      await guest.createAnnotation();
      assert.calledWith(fakeCrossFrame.call, 'openSidebar');
    });

    it('does not open sidebar if `highlight` is true', async () => {
      const guest = createGuest();
      await guest.createAnnotation({ highlight: true });
      assert.notCalled(fakeCrossFrame.call);
    });

    it('triggers a "beforeAnnotationCreated" event', async () => {
      const guest = createGuest();
      const callback = sandbox.stub();
      guest._emitter.subscribe('beforeAnnotationCreated', callback);

      const annotation = await guest.createAnnotation();

      assert.calledWith(callback, annotation);
    });
  });

  describe('#anchor', () => {
    let el;
    let range;

    beforeEach(() => {
      el = document.createElement('span');
      const txt = document.createTextNode('hello');
      el.appendChild(txt);
      document.body.appendChild(el);
      range = document.createRange();
      range.selectNode(el);
    });

    afterEach(() => {
      el.remove();
    });

    it("doesn't mark an annotation lacking targets as an orphan", () => {
      const guest = createGuest();
      const annotation = { target: [] };

      return guest
        .anchor(annotation)
        .then(() => assert.isFalse(annotation.$orphan));
    });

    it("doesn't mark an annotation with a selectorless target as an orphan", () => {
      const guest = createGuest();
      const annotation = { target: [{ source: 'wibble' }] };

      return guest
        .anchor(annotation)
        .then(() => assert.isFalse(annotation.$orphan));
    });

    it("doesn't mark an annotation with only selectorless targets as an orphan", () => {
      const guest = createGuest();
      const annotation = { target: [{ source: 'foo' }, { source: 'bar' }] };

      return guest
        .anchor(annotation)
        .then(() => assert.isFalse(annotation.$orphan));
    });

    it("doesn't mark an annotation in which the target anchors as an orphan", () => {
      const guest = createGuest();
      const annotation = {
        target: [{ selector: [{ type: 'TextQuoteSelector', exact: 'hello' }] }],
      };
      fakeHTMLIntegration.anchor.returns(Promise.resolve(range));

      return guest
        .anchor(annotation)
        .then(() => assert.isFalse(annotation.$orphan));
    });

    it("doesn't mark an annotation in which at least one target anchors as an orphan", () => {
      const guest = createGuest();
      const annotation = {
        target: [
          { selector: [{ type: 'TextQuoteSelector', exact: 'notinhere' }] },
          { selector: [{ type: 'TextQuoteSelector', exact: 'hello' }] },
        ],
      };
      fakeHTMLIntegration.anchor
        .onFirstCall()
        .returns(Promise.reject(new Error('Failed to anchor')))
        .onSecondCall()
        .returns(Promise.resolve(range));

      return guest
        .anchor(annotation)
        .then(() => assert.isFalse(annotation.$orphan));
    });

    it('marks an annotation in which the target fails to anchor as an orphan', () => {
      const guest = createGuest();
      const annotation = {
        target: [
          { selector: [{ type: 'TextQuoteSelector', exact: 'notinhere' }] },
        ],
      };
      fakeHTMLIntegration.anchor.returns(
        Promise.reject(new Error('Failed to anchor'))
      );

      return guest
        .anchor(annotation)
        .then(() => assert.isTrue(annotation.$orphan));
    });

    it('marks an annotation in which all (suitable) targets fail to anchor as an orphan', () => {
      const guest = createGuest();
      const annotation = {
        target: [
          { selector: [{ type: 'TextQuoteSelector', exact: 'notinhere' }] },
          { selector: [{ type: 'TextQuoteSelector', exact: 'neitherami' }] },
        ],
      };
      fakeHTMLIntegration.anchor.returns(
        Promise.reject(new Error('Failed to anchor'))
      );

      return guest
        .anchor(annotation)
        .then(() => assert.isTrue(annotation.$orphan));
    });

    it('marks an annotation where the target has no TextQuoteSelectors as an orphan', () => {
      const guest = createGuest();
      const annotation = {
        target: [
          { selector: [{ type: 'TextPositionSelector', start: 0, end: 5 }] },
        ],
      };
      // This shouldn't be called, but if it is, we successfully anchor so that
      // this test is guaranteed to fail.
      fakeHTMLIntegration.anchor.returns(Promise.resolve(range));

      return guest
        .anchor(annotation)
        .then(() => assert.isTrue(annotation.$orphan));
    });

    it('does not attempt to anchor targets which have no TextQuoteSelector', () => {
      const guest = createGuest();
      const annotation = {
        target: [
          { selector: [{ type: 'TextPositionSelector', start: 0, end: 5 }] },
        ],
      };

      return guest
        .anchor(annotation)
        .then(() => assert.notCalled(fakeHTMLIntegration.anchor));
    });

    it('syncs annotations to the sidebar', () => {
      const guest = createGuest();
      const annotation = {};
      return guest.anchor(annotation).then(() => {
        assert.called(guest.crossframe.sync);
      });
    });

    it('emits an `anchorsChanged` event', async () => {
      const guest = createGuest();
      const annotation = {};
      const anchorsChanged = sandbox.stub();
      guest._emitter.subscribe('anchorsChanged', anchorsChanged);

      await guest.anchor(annotation);

      assert.calledWith(anchorsChanged, guest.anchors);
    });

    it('returns a promise of the anchors for the annotation', () => {
      const guest = createGuest();
      const highlights = [document.createElement('span')];
      fakeHTMLIntegration.anchor.returns(Promise.resolve(range));
      highlighter.highlightRange.returns(highlights);
      const target = {
        selector: [{ type: 'TextQuoteSelector', exact: 'hello' }],
      };
      return guest
        .anchor({ target: [target] })
        .then(anchors => assert.equal(anchors.length, 1));
    });

    it('adds the anchor to the "anchors" instance property"', () => {
      const guest = createGuest();
      const highlights = [document.createElement('span')];
      fakeHTMLIntegration.anchor.returns(Promise.resolve(range));
      highlighter.highlightRange.returns(highlights);
      const target = {
        selector: [{ type: 'TextQuoteSelector', exact: 'hello' }],
      };
      const annotation = { target: [target] };
      return guest.anchor(annotation).then(() => {
        assert.equal(guest.anchors.length, 1);
        assert.strictEqual(guest.anchors[0].annotation, annotation);
        assert.strictEqual(guest.anchors[0].target, target);
        assert.strictEqual(guest.anchors[0].range.toRange(), range);
        assert.strictEqual(guest.anchors[0].highlights, highlights);
      });
    });

    it('destroys targets that have been removed from the annotation', () => {
      const annotation = {};
      const target = {};
      const highlights = [];
      const guest = createGuest();
      guest.anchors = [{ annotation, target, highlights }];
      const { removeHighlights } = highlighter;

      return guest.anchor(annotation).then(() => {
        assert.equal(guest.anchors.length, 0);
        assert.calledOnce(removeHighlights);
        assert.calledWith(removeHighlights, highlights);
      });
    });

    it('focuses the new highlights if the annotation is already focused', async () => {
      const guest = createGuest();
      const highlights = [document.createElement('span')];
      fakeHTMLIntegration.anchor.resolves(range);
      highlighter.highlightRange.returns(highlights);
      const target = {
        selector: [{ type: 'TextQuoteSelector', exact: 'hello' }],
      };
      const annotation = { $tag: 'tag1', target: [target] };

      // Focus the annotation (in the sidebar) before it is anchored in the page.
      const [, focusAnnotationsCallback] = fakeCrossFrame.on.args.find(
        args => args[0] === 'focusAnnotations'
      );
      focusAnnotationsCallback([annotation.$tag]);
      const anchors = await guest.anchor(annotation);

      // Check that the new highlights are already in the focused state.
      assert.equal(anchors.length, 1);
      assert.calledWith(
        highlighter.setHighlightsFocused,
        anchors[0].highlights,
        true
      );
    });
  });

  describe('#detach', () => {
    function createAnchor() {
      return { annotation: {}, highlights: [document.createElement('span')] };
    }

    it('removes anchors associated with the removed annotation', () => {
      const guest = createGuest();
      const annotation = {};
      guest.anchors.push({ annotation });

      guest.detach(annotation);

      assert.equal(guest.anchors.length, 0);
    });

    it('removes any highlights associated with the annotation', () => {
      const guest = createGuest();
      const anchor = createAnchor();
      const { removeHighlights } = highlighter;
      guest.anchors.push(anchor);

      guest.detach(anchor.annotation);

      assert.calledOnce(removeHighlights);
      assert.calledWith(removeHighlights, anchor.highlights);
    });

    it('keeps anchors and highlights associated with other annotations', () => {
      const guest = createGuest();
      const anchorA = createAnchor();
      const anchorB = createAnchor();
      guest.anchors.push(anchorA, anchorB);

      guest.detach(anchorA.annotation);

      assert.include(guest.anchors, anchorB);
      assert.isFalse(
        highlighter.removeHighlights.calledWith(anchorB.highlights)
      );
    });

    it('emits an `anchorsChanged` event with updated anchors', () => {
      const guest = createGuest();
      const anchor = createAnchor();
      const anchorsChanged = sandbox.stub();
      guest._emitter.subscribe('anchorsChanged', anchorsChanged);

      guest.detach(anchor.annotation);

      assert.calledWith(anchorsChanged, guest.anchors);
    });
  });

  describe('#destroy', () => {
    it('disconnects from sidebar events', () => {
      const guest = createGuest();
      guest.destroy();
      assert.calledOnce(fakeCrossFrame.destroy);
    });

    it('removes the adder toolbar', () => {
      const guest = createGuest();
      guest.destroy();

      assert.calledOnce(FakeAdder.instance.destroy);
    });

    it('cleans up PDF integration', () => {
      const guest = createGuest({ documentType: 'pdf' });
      guest.destroy();
      assert.calledOnce(fakePDFIntegration.destroy);
    });

    it('removes all highlights', () => {
      const guest = createGuest();
      guest.destroy();
      assert.calledWith(highlighter.removeAllHighlights, guest.element);
    });
  });

  describe('#contentContainer', () => {
    it('returns root HTML element in HTML document', () => {
      const guest = createGuest();
      assert.equal(
        guest.contentContainer(),
        fakeHTMLIntegration.contentContainer()
      );
    });

    it('returns PDF viewer content container in PDF documents', () => {
      const guest = createGuest({ documentType: 'pdf' });
      assert.equal(
        guest.contentContainer(),
        fakePDFIntegration.contentContainer()
      );
    });
  });

  describe('#fitSideBySide', () => {
    ['html', 'pdf'].forEach(documentType => {
      const getIntegration = () =>
        documentType === 'html' ? fakeHTMLIntegration : fakePDFIntegration;

      context(`in a ${documentType} document`, () => {
        it('attempts to fit content alongside sidebar', () => {
          const guest = createGuest({ documentType });
          getIntegration().fitSideBySide.returns(false);
          const layout = { expanded: true, width: 100 };

          guest.fitSideBySide(layout);

          assert.calledWith(getIntegration().fitSideBySide, layout);
        });

        it('enables closing sidebar on document click if side-by-side is not activated', () => {
          const guest = createGuest({ documentType });
          getIntegration().fitSideBySide.returns(false);
          const layout = { expanded: true, width: 100 };

          guest.fitSideBySide(layout);
          assert.isFalse(guest.sideBySideActive);

          getIntegration().fitSideBySide.returns(true);
          guest.fitSideBySide(layout);
          assert.isTrue(guest.sideBySideActive);
        });
      });
    });
  });
});
