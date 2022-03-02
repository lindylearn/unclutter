import EventEmitter from 'tiny-emitter';

import { Injector } from '../../../shared/injector';
import * as annotationFixtures from '../../test/annotation-fixtures';
import createFakeStore from '../../test/fake-redux-store';

import { FrameSyncService, $imports, formatAnnot } from '../frame-sync';

class FakeWindow extends EventTarget {
  constructor() {
    super();
    this.postMessage = sinon.stub();
  }
}

const fixtures = {
  ann: Object.assign({ $tag: 't1' }, annotationFixtures.defaultAnnotation()),

  // New annotation received from the frame
  newAnnFromFrame: {
    tag: 't1',
    msg: {
      target: [],
    },
  },

  // Response to the `getDocumentInfo` channel message for a frame displaying
  // an HTML document
  htmlDocumentInfo: {
    uri: 'http://example.org',
    metadata: {
      link: [],
    },
    frameIdentifier: null,
  },

  // Response to the `getDocumentInfo` channel message for a frame displaying
  // a PDF
  pdfDocumentInfo: {
    uri: 'http://example.org/paper.pdf',
    metadata: {
      documentFingerprint: '1234',
      link: [{ href: 'http://example.org/paper.pdf' }, { href: 'urn:1234' }],
    },
    frameIdentifier: null,
  },

  // The entry in the list of frames currently connected
  framesListEntry: {
    id: 'abc',
    uri: 'http://example.com',
    isAnnotationFetchComplete: true,
  },
};

describe('FrameSyncService', () => {
  let fakeAnnotationsService;
  let fakeStore;
  let fakeBridge;
  let frameSync;
  let fakeWindow;

  beforeEach(() => {
    fakeStore = createFakeStore(
      { annotations: [] },
      {
        allAnnotations() {
          return this.getState().annotations;
        },
        connectFrame: sinon.stub(),
        destroyFrame: sinon.stub(),
        findIDsForTags: sinon.stub(),
        focusAnnotations: sinon.stub(),
        frames: sinon.stub().returns([fixtures.framesListEntry]),
        isLoggedIn: sinon.stub().returns(false),
        openSidebarPanel: sinon.stub(),
        selectAnnotations: sinon.stub(),
        selectTab: sinon.stub(),
        setSidebarOpened: sinon.stub(),
        toggleSelectedAnnotations: sinon.stub(),
        updateAnchorStatus: sinon.stub(),
      }
    );

    fakeAnnotationsService = { create: sinon.stub() };

    const emitter = new EventEmitter();
    fakeBridge = {
      call: sinon.stub(),
      createChannel: sinon.stub(),
      on: emitter.on.bind(emitter),
      onConnect: function (listener) {
        emitter.on('connect', listener);
      },

      emit: emitter.emit.bind(emitter),
    };

    fakeWindow = new FakeWindow();
    fakeWindow.parent = new FakeWindow();

    frameSync = new Injector()
      .register('$window', { value: fakeWindow })
      .register('annotationsService', { value: fakeAnnotationsService })
      .register('bridge', { value: fakeBridge })
      .register('store', { value: fakeStore })
      .register('frameSync', FrameSyncService)
      .get('frameSync');
  });

  afterEach(() => {
    $imports.$restore();
  });

  describe('#connect', () => {
    beforeEach(() => {
      sinon.stub(console, 'warn');
    });

    afterEach(() => {
      console.warn.restore();
    });

    it('notifies host window that sidebar application is ready', () => {
      frameSync.connect();

      assert.calledWith(fakeWindow.parent.postMessage, {
        type: 'hypothesisSidebarReady',
      });
    });

    it('connects to new guests when they are ready', () => {
      const channel = new MessageChannel();

      frameSync.connect();
      fakeWindow.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'hypothesisGuestReady' },
          ports: [channel.port1],
        })
      );

      assert.calledWith(fakeBridge.createChannel, channel.port1);
    });

    [
      { data: 'not-an-object' },
      { data: {} },
      { data: { type: 'unknownType' } },
      {
        // No ports provided with message
        data: { type: 'hypothesisGuestReady' },
      },
    ].forEach(messageInit => {
      it('ignores `hypothesisGuestReady` messages that are invalid', () => {
        frameSync.connect();
        fakeWindow.dispatchEvent(new MessageEvent('message', messageInit));
        assert.notCalled(fakeBridge.createChannel);
      });
    });
  });

  context('when annotations are loaded into the sidebar', () => {
    beforeEach(() => {
      frameSync.connect();
    });

    it('sends a "loadAnnotations" message to the frame', () => {
      fakeStore.setState({
        annotations: [fixtures.ann],
      });

      assert.calledWithMatch(
        fakeBridge.call,
        'loadAnnotations',
        sinon.match([formatAnnot(fixtures.ann)])
      );
    });

    it('sends a "loadAnnotations" message only for new annotations', () => {
      const ann2 = Object.assign({}, fixtures.ann, { $tag: 't2', id: 'a2' });
      fakeStore.setState({
        annotations: [fixtures.ann],
      });
      fakeBridge.call.reset();

      fakeStore.setState({
        annotations: [fixtures.ann, ann2],
      });

      assert.calledWithMatch(
        fakeBridge.call,
        'loadAnnotations',
        sinon.match([formatAnnot(ann2)])
      );
    });

    it('does not send a "loadAnnotations" message for replies', () => {
      fakeStore.setState({
        annotations: [annotationFixtures.newReply()],
      });

      assert.isFalse(fakeBridge.call.calledWith('loadAnnotations'));
    });
  });

  context('when annotation count has changed', () => {
    beforeEach(() => {
      frameSync.connect();
    });

    it('sends a "publicAnnotationCountChanged" message to the frame when there are public annotations', () => {
      fakeStore.setState({
        annotations: [annotationFixtures.publicAnnotation()],
      });
      assert.calledWithMatch(
        fakeBridge.call,
        'publicAnnotationCountChanged',
        sinon.match(1)
      );
    });

    it('sends a "publicAnnotationCountChanged" message to the frame when there are only private annotations', () => {
      const annot = annotationFixtures.defaultAnnotation();
      delete annot.permissions;

      fakeStore.setState({
        annotations: [annot],
      });

      assert.calledWithMatch(
        fakeBridge.call,
        'publicAnnotationCountChanged',
        sinon.match(0)
      );
    });

    it('does not send a "publicAnnotationCountChanged" message to the frame if annotation fetch is not complete', () => {
      fakeStore.frames.returns([{ uri: 'http://example.com' }]);
      fakeStore.setState({
        annotations: [annotationFixtures.publicAnnotation()],
      });
      assert.isFalse(
        fakeBridge.call.calledWith('publicAnnotationCountChanged')
      );
    });

    it('does not send a "publicAnnotationCountChanged" message if there are no connected frames', () => {
      fakeStore.frames.returns([]);
      fakeStore.setState({
        annotations: [annotationFixtures.publicAnnotation()],
      });
      assert.isFalse(
        fakeBridge.call.calledWith('publicAnnotationCountChanged')
      );
    });
  });

  context('when annotations are removed from the sidebar', () => {
    it('sends a "deleteAnnotation" message to the frame', () => {
      frameSync.connect();
      fakeStore.setState({
        annotations: [fixtures.ann],
      });

      fakeStore.setState({
        annotations: [],
      });

      assert.calledWithMatch(
        fakeBridge.call,
        'deleteAnnotation',
        sinon.match(formatAnnot(fixtures.ann))
      );
    });
  });

  context('when a new annotation is created in the frame', () => {
    context('when an authenticated user is present', () => {
      it('creates the annotation in the sidebar', () => {
        frameSync.connect();
        fakeStore.isLoggedIn.returns(true);
        const ann = { target: [] };

        fakeBridge.emit('beforeCreateAnnotation', { tag: 't1', msg: ann });

        assert.calledWith(
          fakeAnnotationsService.create,
          sinon.match({
            $tag: 't1',
            target: [],
          })
        );
      });
    });

    context('when no authenticated user is present', () => {
      beforeEach(() => {
        fakeStore.isLoggedIn.returns(false);
        frameSync.connect();
      });

      it('should not create an annotation in the sidebar', () => {
        const ann = { target: [] };

        fakeBridge.emit('beforeCreateAnnotation', { tag: 't1', msg: ann });

        assert.notCalled(fakeAnnotationsService.create);
      });

      it('should open the sidebar', () => {
        const ann = { target: [] };
        fakeBridge.emit('beforeCreateAnnotation', { tag: 't1', msg: ann });

        assert.calledWith(fakeBridge.call, 'openSidebar');
      });

      it('should open the login prompt panel', () => {
        const ann = { target: [] };
        fakeBridge.emit('beforeCreateAnnotation', { tag: 't1', msg: ann });

        assert.calledWith(fakeStore.openSidebarPanel, 'loginPrompt');
      });

      it('should send a "deleteAnnotation" message to the frame', () => {
        const ann = { target: [] };
        fakeBridge.emit('beforeCreateAnnotation', { tag: 't1', msg: ann });

        assert.calledWith(fakeBridge.call, 'deleteAnnotation');
      });
    });
  });

  context('when anchoring completes', () => {
    let clock = sinon.stub();

    beforeEach(() => {
      clock = sinon.useFakeTimers();
      frameSync.connect();
    });

    afterEach(() => {
      clock.restore();
    });

    function expireDebounceTimeout() {
      // "Wait" for debouncing timeout to expire and pending anchoring status
      // updates to be applied.
      clock.tick(20);
    }

    it('updates the anchoring status for the annotation', () => {
      fakeBridge.emit('sync', [{ tag: 't1', msg: { $orphan: false } }]);

      expireDebounceTimeout();

      assert.calledWith(fakeStore.updateAnchorStatus, { t1: 'anchored' });
    });

    it('coalesces multiple "sync" messages', () => {
      fakeBridge.emit('sync', [{ tag: 't1', msg: { $orphan: false } }]);
      fakeBridge.emit('sync', [{ tag: 't2', msg: { $orphan: true } }]);

      expireDebounceTimeout();

      assert.calledWith(fakeStore.updateAnchorStatus, {
        t1: 'anchored',
        t2: 'orphan',
      });
    });
  });

  context('when a new frame connects', () => {
    let frameInfo;
    const fakeChannel = {
      call: function (name, callback) {
        callback(null, frameInfo);
      },
      destroy: sinon.stub(),
    };

    beforeEach(() => {
      frameSync.connect();
    });

    it("adds the page's metadata to the frames list", () => {
      frameInfo = fixtures.htmlDocumentInfo;

      fakeBridge.emit('connect', fakeChannel);

      assert.calledWith(fakeStore.connectFrame, {
        id: frameInfo.frameIdentifier,
        metadata: frameInfo.metadata,
        uri: frameInfo.uri,
      });
    });

    it('closes the channel and does not add frame to store if getting document info fails', () => {
      fakeChannel.call = (name, callback) => callback('Something went wrong');

      fakeBridge.emit('connect', fakeChannel);

      assert.called(fakeChannel.destroy);
      assert.notCalled(fakeStore.connectFrame);
    });
  });

  context('when a frame is destroyed', () => {
    const frameId = fixtures.framesListEntry.id;

    it('removes the frame from the frames list', () => {
      frameSync.connect();
      fakeBridge.emit('destroyFrame', frameId);

      assert.calledWith(fakeStore.destroyFrame, fixtures.framesListEntry);
    });
  });

  describe('on "showAnnotations" message', () => {
    it('selects annotations which have an ID', () => {
      frameSync.connect();
      fakeStore.findIDsForTags.returns(['id1', 'id2', 'id3']);
      fakeBridge.emit('showAnnotations', ['tag1', 'tag2', 'tag3']);

      assert.calledWith(fakeStore.selectAnnotations, ['id1', 'id2', 'id3']);
      assert.calledWith(fakeStore.selectTab, 'annotation');
    });
  });

  describe('on "focusAnnotations" message', () => {
    it('focuses the annotations', () => {
      frameSync.connect();
      fakeBridge.emit('focusAnnotations', ['tag1', 'tag2', 'tag3']);
      assert.calledWith(fakeStore.focusAnnotations, ['tag1', 'tag2', 'tag3']);
    });
  });

  describe('on "toggleAnnotationSelection" message', () => {
    it('toggles the selected state of the annotations', () => {
      frameSync.connect();
      fakeStore.findIDsForTags.returns(['id1', 'id2', 'id3']);
      fakeBridge.emit('toggleAnnotationSelection', ['tag1', 'tag2', 'tag3']);
      assert.calledWith(fakeStore.toggleSelectedAnnotations, [
        'id1',
        'id2',
        'id3',
      ]);
    });
  });

  describe('on "sidebarOpened" message', () => {
    it('sets the sidebar open in the store', () => {
      frameSync.connect();
      fakeBridge.emit('sidebarOpened');

      assert.calledWith(fakeStore.setSidebarOpened, true);
    });
  });

  describe('on a relayed bridge call', () => {
    beforeEach(() => {
      frameSync.connect();
    });

    it('calls "openSidebar"', () => {
      fakeBridge.emit('openSidebar');

      assert.calledWith(fakeBridge.call, 'openSidebar');
    });

    it('calls "closeSidebar"', () => {
      fakeBridge.emit('closeSidebar');

      assert.calledWith(fakeBridge.call, 'closeSidebar');
    });

    it('calls "setVisibleHighlights"', () => {
      fakeBridge.emit('setVisibleHighlights');

      assert.calledWith(fakeBridge.call, 'setVisibleHighlights');
    });
  });

  describe('#focusAnnotations', () => {
    beforeEach(() => {
      frameSync.connect();
    });

    it('should update the focused annotations in the store', () => {
      frameSync.focusAnnotations(['a1', 'a2']);
      assert.calledWith(
        fakeStore.focusAnnotations,
        sinon.match.array.deepEquals(['a1', 'a2'])
      );
    });

    it('should notify the host page', () => {
      frameSync.focusAnnotations([1, 2]);
      assert.calledWith(
        fakeBridge.call,
        'focusAnnotations',
        sinon.match.array.deepEquals([1, 2])
      );
    });
  });

  describe('#scrollToAnnotation', () => {
    it('should scroll to the annotation in the host page', () => {
      frameSync.connect();
      frameSync.scrollToAnnotation('atag');
      assert.calledWith(fakeBridge.call, 'scrollToAnnotation', 'atag');
    });
  });
});
