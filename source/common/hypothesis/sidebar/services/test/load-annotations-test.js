import EventEmitter from 'tiny-emitter';

import { LoadAnnotationsService, $imports } from '../load-annotations';

let searchClients;
let longRunningSearchClient = false;
class FakeSearchClient extends EventEmitter {
  constructor(
    searchFn,
    {
      incremental,
      separateReplies,
      sortBy = 'created',
      sortOrder = 'asc',
      maxResults = null,
    }
  ) {
    super();

    assert.ok(searchFn);
    searchClients.push(this);
    this.cancel = sinon.stub();
    this.incremental = !!incremental;
    this.separateReplies = !!separateReplies;
    this.sortBy = sortBy;
    this.sortOrder = sortOrder;
    this.maxResults = maxResults;

    this.get = sinon.spy(query => {
      if (!query.uri) {
        query.uri = ['http://www.example.com'];
      }

      this.emit('resultCount', 2);

      for (let i = 0; i < query.uri.length; i++) {
        const uri = query.uri[i];
        this.emit('results', [{ id: uri + '123', group: query.group }]);
        this.emit('results', [{ id: uri + '456', group: query.group }]);
      }
      if (!longRunningSearchClient) {
        this.emit('end');
      }
    });
  }
}

describe('LoadAnnotationsService', () => {
  let fakeApi;
  let fakeStore;
  let fakeStreamer;
  let fakeStreamFilter;

  const fakeGroupId = 'group-id';
  let fakeUris;

  beforeEach(() => {
    sinon.stub(console, 'error');
    searchClients = [];
    longRunningSearchClient = false;

    fakeApi = {
      search: sinon.stub().returns({ rows: [] }),
      annotation: {
        get: sinon.stub(),
      },
    };

    fakeStore = {
      addAnnotations: sinon.stub(),
      annotationFetchFinished: sinon.stub(),
      annotationFetchStarted: sinon.stub(),
      clearAnnotations: sinon.stub(),
      frames: sinon.stub(),
      removeAnnotations: sinon.stub(),
      savedAnnotations: sinon.stub(),
      setAnnotationResultCount: sinon.stub(),
      updateFrameAnnotationFetchStatus: sinon.stub(),
    };

    fakeStreamer = {
      setConfig: sinon.stub(),
      connect: sinon.stub(),
      reconnect: sinon.stub(),
    };
    fakeStreamFilter = {
      addClause: sinon.stub().returns({
        addClause: sinon.stub(),
      }),
      resetFilter: sinon.stub().returns({
        addClause: sinon.stub(),
      }),
      getFilter: sinon.stub().returns({}),
    };

    fakeUris = ['http://example.com'];
    $imports.$mock({
      '../search-client': {
        SearchClient: FakeSearchClient,
      },
    });
  });

  afterEach(() => {
    console.error.restore();
    $imports.$restore();
  });

  function createService() {
    fakeStore.frames.returns(
      fakeUris.map(uri => {
        return { uri };
      })
    );
    return new LoadAnnotationsService(
      fakeApi,
      fakeStore,
      fakeStreamer,
      fakeStreamFilter
    );
  }

  describe('#load', () => {
    it('unloads any existing annotations', () => {
      // When new clients connect, all existing annotations should be unloaded
      // before reloading annotations for each currently-connected client.
      fakeStore.savedAnnotations.returns([
        { id: fakeUris[0] + '123' },
        { id: fakeUris[0] + '456' },
      ]);
      const svc = createService();

      svc.load({ groupId: fakeGroupId, uris: fakeUris });
      assert.calledWith(fakeStore.removeAnnotations, [
        sinon.match({ id: fakeUris[0] + '123' }),
        sinon.match({ id: fakeUris[0] + '456' }),
      ]);
    });

    it('loads all annotations for a URI', () => {
      const svc = createService();

      svc.load({ groupId: fakeGroupId, uris: fakeUris });
      assert.calledWith(fakeStore.addAnnotations, [
        sinon.match({ id: fakeUris[0] + '123' }),
      ]);
      assert.calledWith(fakeStore.addAnnotations, [
        sinon.match({ id: fakeUris[0] + '456' }),
      ]);
    });

    it('loads all annotations for a group', () => {
      const svc = createService();

      svc.load({ groupId: 'mygroup' });

      assert.calledWith(fakeStore.addAnnotations, [
        sinon.match({ group: 'mygroup' }),
      ]);
    });

    it('loads all annotations for a frame with multiple URIs', () => {
      const uri = 'http://example.com/test.pdf';
      const fingerprint = 'urn:x-pdf:fingerprint';
      fakeUris = [uri, fingerprint];
      const svc = createService();
      // Override the default frames set by the service call above.
      fakeStore.frames.returns([
        {
          uri,
          metadata: {
            documentFingerprint: 'fingerprint',
            link: [
              {
                href: fingerprint,
              },
              {
                href: uri,
              },
            ],
          },
        },
      ]);

      svc.load({ groupId: fakeGroupId, uris: fakeUris });
      assert.calledWith(fakeStore.addAnnotations, [
        sinon.match({ id: uri + '123' }),
      ]);
      assert.calledWith(fakeStore.addAnnotations, [
        sinon.match({ id: fingerprint + '123' }),
      ]);
      assert.calledWith(fakeStore.addAnnotations, [
        sinon.match({ id: uri + '456' }),
      ]);
      assert.calledWith(fakeStore.addAnnotations, [
        sinon.match({ id: fingerprint + '456' }),
      ]);
    });

    it('loads all annotations for all URIs', () => {
      fakeUris = ['http://example.com', 'http://foobar.com'];
      const svc = createService();

      svc.load({ groupId: fakeGroupId, uris: fakeUris });

      [
        fakeUris[0] + '123',
        fakeUris[0] + '456',
        fakeUris[1] + '123',
        fakeUris[1] + '456',
      ].forEach(uri => {
        assert.calledWith(fakeStore.addAnnotations, [sinon.match({ id: uri })]);
      });
    });

    it('updates the expected result count in the store', () => {
      fakeUris = ['http://example.com'];
      const svc = createService();

      svc.load({ groupId: fakeGroupId, uris: fakeUris });

      assert.calledOnce(fakeStore.setAnnotationResultCount);
      assert.calledWith(fakeStore.setAnnotationResultCount, 2);
    });

    it('updates annotation fetch status for all frames', () => {
      fakeUris = ['http://example.com', 'http://foobar.com'];
      const svc = createService();

      svc.load({ groupId: fakeGroupId, uris: fakeUris });
      assert.calledWith(
        fakeStore.updateFrameAnnotationFetchStatus,
        fakeUris[0],
        true
      );
      assert.calledWith(
        fakeStore.updateFrameAnnotationFetchStatus,
        fakeUris[1],
        true
      );
    });

    it('fetches annotations for the specified group', () => {
      const svc = createService();

      svc.load({ groupId: fakeGroupId, uris: fakeUris });
      assert.calledWith(searchClients[0].get, {
        uri: fakeUris,
        group: fakeGroupId,
      });
    });

    it('loads annotations in batches', () => {
      const svc = createService();

      svc.load({ groupId: fakeGroupId, uris: fakeUris });
      assert.ok(searchClients[0].incremental);
    });

    it('loads annotations without separating replies', () => {
      const svc = createService();

      svc.load({ groupId: fakeGroupId, uris: fakeUris });
      assert.isFalse(searchClients[0].separateReplies);
    });

    it('search annotations with default SearchClient parameters', () => {
      const svc = createService();

      svc.load({ groupId: fakeGroupId, uris: fakeUris });

      assert.equal(searchClients[0].sortBy, 'created');
      assert.equal(searchClients[0].sortOrder, 'asc');
      assert.equal(searchClients[0].maxResults, null);

      svc.load({
        groupId: fakeGroupId,
        uris: fakeUris,
        sortBy: undefined,
        sortOrder: undefined,
        maxResults: undefined,
      });

      assert.equal(searchClients[1].sortBy, 'created');
      assert.equal(searchClients[1].sortOrder, 'asc');
      assert.equal(searchClients[1].maxResults, null);
    });

    it('search annotations with custom SearchClient parameters', () => {
      const svc = createService();

      svc.load({
        groupId: fakeGroupId,
        uris: fakeUris,
        sortBy: 'updated',
        sortOrder: 'desc',
        maxResults: 50,
      });

      assert.equal(searchClients[0].sortBy, 'updated');
      assert.equal(searchClients[0].sortOrder, 'desc');
      assert.equal(searchClients[0].maxResults, 50);
    });

    it("cancels previously search client if it's still running", () => {
      const svc = createService();

      // Issue a long running load annotations request.
      longRunningSearchClient = true;
      svc.load({ groupId: fakeGroupId, uris: fakeUris });
      // Issue another load annotations request while the
      // previous annotation load is still running.
      svc.load({ groupId: fakeGroupId, uris: fakeUris });

      assert.calledOnce(searchClients[0].cancel);
    });

    it('calls annotationFetchStarted when it starts searching for annotations', () => {
      const svc = createService();

      svc.load({ groupId: fakeGroupId, uris: fakeUris });

      assert.calledOnce(fakeStore.annotationFetchStarted);
    });

    it('calls annotationFetchFinished when all annotations have been found', () => {
      const svc = createService();

      svc.load({ groupId: fakeGroupId, uris: fakeUris });

      assert.calledOnce(fakeStore.annotationFetchFinished);
    });

    it('logs an error by default to the console if the search client emits an error', () => {
      const svc = createService();
      const error = new Error('search for annotations failed');

      svc.load({ groupId: fakeGroupId, uris: fakeUris });
      searchClients[0].emit('error', error);

      assert.calledWith(console.error, error);
    });

    it('invokes error callback, if provided, when search client emits an error', () => {
      const svc = createService();
      const onError = sinon.stub();
      const error = new Error('Something went wrong');

      svc.load({ groupId: fakeGroupId, uris: fakeUris, onError });
      searchClients[0].emit('error', error);

      assert.calledWith(onError, error);
    });

    it('configures the streamer to filter on uris (default)', () => {
      const fakeAddClause = sinon.stub();
      fakeStreamFilter.resetFilter.returns({ addClause: fakeAddClause });
      const svc = createService();

      // doesn't set the filtering if uris are undefined or []
      svc.load({ groupId: fakeGroupId });
      assert.notCalled(fakeAddClause);
      assert.notCalled(fakeStreamer.setConfig);

      svc.load({ groupId: fakeGroupId, uris: [] });
      assert.notCalled(fakeAddClause);
      assert.notCalled(fakeStreamer.setConfig);

      svc.load({ groupId: fakeGroupId, uris: fakeUris });
      assert.calledWith(fakeAddClause, '/uri', 'one_of', fakeUris);
      assert.called(fakeStreamer.setConfig);
    });

    it('configures the streamer to filter on groups (if streamFilterBy is set to "group")', () => {
      const fakeAddClause = sinon.stub();
      fakeStreamFilter.resetFilter.returns({ addClause: fakeAddClause });
      const svc = createService();

      svc.load({ groupId: fakeGroupId, streamFilterBy: 'group' });
      assert.calledWith(fakeAddClause, '/group', 'equals', fakeGroupId, true);
      assert.called(fakeStreamer.setConfig);
    });
  });

  describe('#loadThread', () => {
    let threadAnnotations = [
      { id: 'parent_annotation_1' },
      { id: 'parent_annotation_2', references: ['parent_annotation_1'] },
      {
        id: 'target_annotation',
        references: ['parent_annotation_1', 'parent_annotation_2'],
      },
    ];
    it('clears annotations from the store first', async () => {
      fakeApi.annotation.get.onFirstCall().resolves({
        id: 'target_annotation',
        references: [],
      });
      const svc = createService();

      await svc.loadThread('target_annotation');

      assert.calledOnce(fakeStore.clearAnnotations);
    });

    describe('fetching the target annotation', () => {
      beforeEach(() => {
        fakeApi.annotation.get.onFirstCall().resolves({
          id: 'target_annotation',
          references: [],
        });
      });

      it('fetches annotation with given `id`', async () => {
        const svc = createService();
        await svc.loadThread('target_annotation');

        assert.calledWith(
          fakeApi.annotation.get,
          sinon.match({ id: 'target_annotation' })
        );
      });

      it('records the start and end of annotation fetch with the store', async () => {
        const svc = createService();
        await svc.loadThread('target_annotation');

        assert.calledOnce(fakeStore.annotationFetchStarted);
        assert.calledOnce(fakeStore.annotationFetchFinished);
      });

      it('stops the annotation fetch with the store on error', async () => {
        fakeApi.annotation.get.onFirstCall().throws();

        const svc = createService();
        try {
          await svc.loadThread('target_annotation');
        } catch (e) {
          assert.calledOnce(fakeStore.annotationFetchStarted);
          assert.calledOnce(fakeStore.annotationFetchFinished);
        }
      });
    });

    describe('fetching top-level annotation in thread', () => {
      beforeEach(() => {
        fakeApi.annotation.get.onFirstCall().resolves({
          id: 'target_annotation',
          references: ['parent_annotation_1', 'parent_annotation_2'],
        });
        fakeApi.annotation.get.onSecondCall().resolves({
          id: 'parent_annotation_1',
          references: [],
        });
      });

      it('fetches top-level annotation', async () => {
        const svc = createService();
        await svc.loadThread('target_annotation');

        assert.calledWith(
          fakeApi.annotation.get,
          sinon.match({ id: 'parent_annotation_1' })
        );
      });
    });

    describe('fetching other annotations in the thread', () => {
      beforeEach(() => {
        fakeApi.annotation.get.onFirstCall().resolves({
          id: 'target_annotation',
          references: ['parent_annotation_1', 'parent_annotation_2'],
        });
        fakeApi.annotation.get.onSecondCall().resolves({
          id: 'parent_annotation_1',
          references: [],
        });
        fakeApi.search.resolves({
          rows: [threadAnnotations[1], threadAnnotations[2]],
        });
      });

      it('retrieves all annotations in the thread', async () => {
        const svc = createService();
        await svc.loadThread('target_annotation');

        assert.calledWith(
          fakeApi.search,
          sinon.match({ references: 'parent_annotation_1' })
        );
      });

      it('adds all of the annotations in the thread to the store', async () => {
        const svc = createService();
        await svc.loadThread('target_annotation');

        assert.calledWith(fakeStore.addAnnotations, sinon.match.array);
      });

      it('returns thread annotations', async () => {
        const svc = createService();
        const annots = await svc.loadThread('target_annotation');

        assert.equal(annots[0].id, 'parent_annotation_1');
        assert.equal(annots[1].id, 'parent_annotation_2');
        assert.equal(annots[2].id, 'target_annotation');
      });
    });

    describe('connecting to streamer for thread updates', () => {
      beforeEach(() => {
        fakeApi.annotation.get.onFirstCall().resolves({
          id: 'target_annotation',
          references: ['parent_annotation_1', 'parent_annotation_2'],
        });
        fakeApi.annotation.get.onSecondCall().resolves({
          id: 'parent_annotation_1',
          references: [],
        });
        fakeApi.search.resolves({
          rows: [threadAnnotations[1], threadAnnotations[2]],
        });
      });

      it('does not connect to the streamer if no top-level annotation available', async () => {
        // Make it so the "top-level" annotation isn't really top level: it has references
        // and so is a reply
        fakeApi.annotation.get.onSecondCall().resolves({
          id: 'parent_annotation_1',
          references: ['something_else'],
        });

        const svc = createService();
        svc.loadThread('target_annotation');

        await new Promise(resolve => setTimeout(resolve, 0));

        assert.notCalled(fakeStreamer.connect);
      });

      it('configures the stream filter for changes to the thread', async () => {
        const fakeAddClause = sinon.stub();
        fakeStreamFilter.addClause.returns({ addClause: fakeAddClause });
        fakeStreamFilter.getFilter.returns('filter');
        const svc = createService();
        svc.loadThread('target_annotation');

        await new Promise(resolve => setTimeout(resolve, 0));

        assert.calledWith(
          fakeStreamFilter.addClause,
          '/references',
          'one_of',
          'parent_annotation_1',
          true
        );
        assert.calledWith(
          fakeAddClause,
          '/id',
          'equals',
          'parent_annotation_1',
          true
        );
        assert.calledWith(
          fakeStreamer.setConfig,
          'filter',
          sinon.match({ filter: 'filter' })
        );
        assert.calledOnce(fakeStreamer.connect);
      });
    });
  });
});
