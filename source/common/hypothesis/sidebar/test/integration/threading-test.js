import { mount } from 'enzyme';
import { useReducer } from 'preact/hooks';
import { act } from 'preact/test-utils';

import { Injector } from '../../../shared/injector';
import { createSidebarStore } from '../../store';

import { ServiceContext } from '../../service-context';
import useRootThread from '../../components/hooks/use-root-thread';

const fixtures = {
  annotations: [
    {
      $orphan: false,
      created: 50,
      id: '1',
      references: [],
      target: [{ selector: [] }],
      text: 'first annotation',
      updated: 300,
    },
    {
      $orphan: false,
      created: 200,
      id: '2',
      references: [],
      text: 'second annotation',
      target: [{ selector: [] }],
      updated: 200,
    },
    {
      $orphan: false,
      created: 100,
      id: '3',
      references: ['2'],
      text: 'reply to first annotation',
      updated: 100,
    },
  ],
};

describe('integration: annotation threading', () => {
  let lastRootThread;
  let store;
  let forceUpdate;

  beforeEach(() => {
    const container = new Injector()
      .register('store', { factory: createSidebarStore })
      .register('annotationsService', () => {})
      .register('settings', { value: {} });

    // Mount a dummy component to be able to use the `useRootThread` hook
    // Do things that cause `useRootThread` to recalculate in the store and
    // test them (hint: use `act`)
    function DummyComponent() {
      lastRootThread = useRootThread();
      [, forceUpdate] = useReducer(x => x + 1, 0);
    }

    store = container.get('store');
    // Wrap the dummy component in a context so that it has access to the store
    mount(
      <ServiceContext.Provider value={container}>
        <DummyComponent />
      </ServiceContext.Provider>
    );
  });

  it('should update root thread only when relevant state changes', () => {
    let prevRootThread = lastRootThread;

    // Make a change which affects the thread.
    act(() => {
      store.addAnnotations(fixtures.annotations);
    });

    assert.notEqual(lastRootThread, prevRootThread);
    prevRootThread = lastRootThread;

    // Re-render the UI without changing any of the data that affects the thread.
    act(() => {
      forceUpdate();
    });
    assert.equal(lastRootThread, prevRootThread);
  });

  it('should display newly loaded annotations', () => {
    act(() => {
      store.addAnnotations(fixtures.annotations);
    });

    assert.equal(lastRootThread.children.length, 2);
  });

  it('should not display unloaded annotations', () => {
    act(() => {
      store.addAnnotations(fixtures.annotations);
      store.removeAnnotations(fixtures.annotations);
    });
    assert.equal(lastRootThread.children.length, 0);
  });

  it('should filter annotations when a search is set', () => {
    act(() => {
      store.addAnnotations(fixtures.annotations);
      store.setFilterQuery('second');
    });

    assert.equal(lastRootThread.children.length, 1);
    assert.equal(lastRootThread.children[0].id, '2');
  });

  [
    {
      sortKey: 'Oldest',
      expectedOrder: ['1', '2'],
    },
    {
      sortKey: 'Newest',
      expectedOrder: ['2', '1'],
    },
  ].forEach(testCase => {
    it(`should sort annotations by ${testCase.sortKey}`, () => {
      act(() => {
        store.addAnnotations(fixtures.annotations);
        store.setSortKey(testCase.sortKey);
      });

      const actualOrder = lastRootThread.children.map(
        thread => thread.annotation.id
      );
      assert.deepEqual(actualOrder, testCase.expectedOrder);
    });
  });
});
