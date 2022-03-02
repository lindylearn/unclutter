import { mount } from 'enzyme';

import mockImportedComponents from '../../../test-util/mock-imported-components';
import { waitFor } from '../../../test-util/wait';

import StreamView, { $imports } from '../StreamView';

describe('StreamView', () => {
  let fakeApi;
  let fakeUseRootThread;
  let fakeSearchFilter;
  let fakeStore;
  let fakeToastMessenger;

  beforeEach(() => {
    fakeApi = {
      search: sinon.stub().resolves({ rows: [], replies: [], total: 0 }),
    };

    fakeUseRootThread = sinon.stub().returns({
      children: [],
    });

    fakeSearchFilter = {
      toObject: sinon.stub().returns({}),
    };

    fakeStore = {
      addAnnotations: sinon.stub(),
      annotationFetchStarted: sinon.stub(),
      annotationFetchFinished: sinon.stub(),
      clearAnnotations: sinon.spy(),
      routeParams: sinon.stub().returns({ id: 'test' }),
      setSortKey: sinon.spy(),
    };

    fakeToastMessenger = {
      error: sinon.stub(),
    };

    $imports.$mock(mockImportedComponents());
    $imports.$mock({
      './hooks/use-root-thread': fakeUseRootThread,
      '../store/use-store': { useStoreProxy: () => fakeStore },
      '../util/search-filter': fakeSearchFilter,
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  function createComponent() {
    return mount(
      <StreamView api={fakeApi} toastMessenger={fakeToastMessenger} />
    );
  }

  it('clears any existing annotations when the /stream route is loaded', () => {
    createComponent();
    assert.calledOnce(fakeStore.clearAnnotations);
  });

  it('calls the search API with `_separate_replies: true`', () => {
    createComponent();
    assert.equal(fakeApi.search.firstCall.args[0]._separate_replies, true);
  });

  it('records the start and finish of the fetch request in the store', async () => {
    createComponent();

    await waitFor(() => fakeStore.annotationFetchStarted.calledOnce);
    await waitFor(() => fakeStore.annotationFetchFinished.calledOnce);
  });

  it('records the finish of the fetch request on error', async () => {
    fakeApi.search.throws();
    createComponent();

    await waitFor(() => fakeStore.annotationFetchStarted.calledOnce);
    await waitFor(() => fakeStore.annotationFetchFinished.calledOnce);
  });

  it('loads the annotations and replies into the store', async () => {
    fakeApi.search.resolves({
      rows: ['annotation_1', 'annotation_2'],
      replies: ['reply_1', 'reply_2', 'reply_3'],
    });

    createComponent();
    await waitFor(() => fakeStore.addAnnotations.called);

    assert.calledOnce(fakeStore.addAnnotations);
    assert.calledWith(fakeStore.addAnnotations, [
      'annotation_1',
      'annotation_2',
      'reply_1',
      'reply_2',
      'reply_3',
    ]);
  });

  it('displays an error if fetching annotations fails', async () => {
    fakeApi.search.rejects(new Error('Server error'));

    createComponent();
    await waitFor(() => fakeToastMessenger.error.called);

    assert.calledWith(
      fakeToastMessenger.error,
      'Unable to fetch annotations: Server error'
    );
  });

  context('when route parameters change', () => {
    it('updates annotations if the query changed', () => {
      fakeStore.routeParams.returns({ q: 'test query' });
      const wrapper = createComponent();
      fakeStore.clearAnnotations.resetHistory();
      fakeApi.search.resetHistory();

      fakeStore.routeParams.returns({ q: 'new query' });
      // Force update. `useStore` handles this in the real app.
      wrapper.setProps({});

      assert.called(fakeStore.clearAnnotations);
      assert.called(fakeApi.search);
    });

    it('does not clear annotations if the query did not change', () => {
      fakeStore.routeParams.returns({ q: 'test query' });
      const wrapper = createComponent();
      fakeApi.search.resetHistory();
      fakeStore.clearAnnotations.resetHistory();

      fakeStore.routeParams.returns({ q: 'test query', other_param: 'foo' });
      // Force update. `useStore` handles this in the real app.
      wrapper.setProps({});

      assert.notCalled(fakeStore.clearAnnotations);
      assert.notCalled(fakeApi.search);
    });
  });
});
