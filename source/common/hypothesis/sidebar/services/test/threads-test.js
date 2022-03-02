import { ThreadsService } from '../threads';

const NESTED_THREADS = {
  id: 'top',
  annotation: {},
  children: [
    {
      id: '1',
      annotation: {},
      children: [
        {
          id: '1a',
          annotation: {},
          children: [{ annotation: {}, id: '1ai', children: [] }],
        },
        {
          id: '1b',
          annotation: {},
          children: [],
          visible: true,
        },
        {
          id: '1c',
          annotation: {},
          children: [
            {
              id: '1ci',
              annotation: {},
              children: [],
              visible: false,
            },
          ],
        },
      ],
    },
    {
      id: '2',
      annotation: {},
      children: [
        { id: '2a', annotation: {}, children: [] },
        {
          id: '2b',
          children: [
            {
              id: '2bi',
              annotation: {},
              children: [],
              visible: true,
            },
            { id: '2bii', annotation: {}, children: [] },
          ],
        },
      ],
    },
    {
      id: '3',
      annotation: {},
      children: [],
    },
  ],
};

describe('ThreadsService', () => {
  let fakeStore;
  let service;

  beforeEach(() => {
    fakeStore = {
      setForcedVisible: sinon.stub(),
    };
    service = new ThreadsService(fakeStore);
  });

  describe('#forceVisible', () => {
    let nonVisibleThreadIds;
    beforeEach(() => {
      nonVisibleThreadIds = [
        'top',
        '1',
        '2',
        '3',
        '1a',
        '1c',
        '2a',
        '2b',
        '1ai',
        '1ci',
        '2bii',
      ];
    });
    it('should set the thread and its children force-visible in the store', () => {
      service.forceVisible(NESTED_THREADS);
      nonVisibleThreadIds.forEach(threadId => {
        assert.calledWith(fakeStore.setForcedVisible, threadId);
        assert.callCount(
          fakeStore.setForcedVisible,
          nonVisibleThreadIds.length
        );
      });
    });

    it('should not set the visibility on thread ancestors', () => {
      // This starts at the level with `id` of '1'
      service.forceVisible(NESTED_THREADS.children[0]);

      const calledWithThreadIds = [];
      for (let i = 0; i < fakeStore.setForcedVisible.callCount; i++) {
        calledWithThreadIds.push(fakeStore.setForcedVisible.getCall(i).args[0]);
      }
      assert.deepEqual(calledWithThreadIds, ['1ai', '1a', '1ci', '1c', '1']);
    });
  });
});
