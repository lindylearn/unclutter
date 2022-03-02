import { mount } from 'enzyme';

import useRootThread from '../use-root-thread';
import { $imports } from '../use-root-thread';

describe('sidebar/components/hooks/use-root-thread', () => {
  let fakeStore;
  let fakeThreadAnnotations;
  let lastRootThread;

  beforeEach(() => {
    fakeStore = {
      allAnnotations: sinon.stub().returns(['1', '2']),
      filterQuery: sinon.stub().returns('itchy'),
      route: sinon.stub().returns('66'),
      selectionState: sinon.stub().returns({ hi: 'there' }),
      getFilterValues: sinon.stub().returns({ user: 'hotspur' }),
    };
    fakeThreadAnnotations = sinon.stub().returns('fakeThreadAnnotations');

    $imports.$mock({
      '../../store/use-store': { useStoreProxy: () => fakeStore },
      '../../helpers/thread-annotations': fakeThreadAnnotations,
    });

    // Mount a dummy component to be able to use the `useRootThread` hook
    // Do things that cause `useRootThread` to recalculate in the store and
    // test them (hint: use `act`)
    function DummyComponent() {
      lastRootThread = useRootThread();
    }
    mount(<DummyComponent />);
  });

  afterEach(() => {
    $imports.$restore();
  });

  it('should return results of `threadAnnotations` with current thread state', () => {
    const threadState = fakeThreadAnnotations.getCall(0).args[0];

    assert.deepEqual(threadState.annotations, ['1', '2']);
    assert.equal(threadState.selection.filterQuery, 'itchy');
    assert.equal(threadState.route, '66');
    assert.equal(threadState.selection.filters.user, 'hotspur');

    assert.equal(lastRootThread, 'fakeThreadAnnotations');
  });
});
