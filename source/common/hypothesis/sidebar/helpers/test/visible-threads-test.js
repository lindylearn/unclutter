import { calculateVisibleThreads } from '../visible-threads';

describe('sidebar/helpers/visible-threads', () => {
  let fakeThreads;
  let fakeThreadHeights;
  let fakeWindowHeight;
  let fakeDefaultDimensions;

  beforeEach(() => {
    fakeThreads = [
      { id: 't1' },
      { id: 't2' },
      { id: 't3' },
      { id: 't4' },
      { id: 't5' },
      { id: 't6' },
      { id: 't7' },
      { id: 't8' },
      { id: 't9' },
      { id: 't10' },
    ];
    fakeThreadHeights = {};
    fakeWindowHeight = 100;
    fakeDefaultDimensions = {
      defaultHeight: 200,
      marginAbove: 800,
      marginBelow: 800,
    };
  });

  describe('calculateVisibleThreads', () => {
    it('There should be no `offscreenUpperHeight` if `scrollpos` is 0', () => {
      // No threads will be rendered above the viewport when scrollpos is 0
      const calculated = calculateVisibleThreads(
        fakeThreads,
        fakeThreadHeights,
        0, // scrollpos
        fakeWindowHeight,
        fakeDefaultDimensions
      );

      assert.equal(calculated.offscreenUpperHeight, 0);
    });

    it('should calculate visible threads when at 0 scrollpos', () => {
      // Default margins above and below are 800px each; default height of each thread: 200px
      const calculated = calculateVisibleThreads(
        fakeThreads,
        fakeThreadHeights,
        0,
        200,
        fakeDefaultDimensions
      );

      const visibleIds = calculated.visibleThreads.map(thread => thread.id);

      // There are 10 threads, each taking up an estimated 200px of space. There
      // is no "above the viewport" space because the scroll is already at the
      // top of the viewport. Thus, visible threads should be the one that takes
      // up the 200px of the window height itself, plus 800 margin below / 200
      // (4 additional threads): thus, the first 5 threads should be considered
      // "visible."
      assert.deepEqual(visibleIds, ['t1', 't2', 't3', 't4', 't5']);
      // The space offscreen below should be the remaining 5 threads at their
      // estimated 200px heights:
      assert.equal(calculated.offscreenLowerHeight, 1000);
    });

    it('should calculate visible threads when at non-0 scrollpos', () => {
      const calculated = calculateVisibleThreads(
        fakeThreads,
        fakeThreadHeights,
        1200, // scrollPos
        100,
        fakeDefaultDimensions
      );

      const visibleIds = calculated.visibleThreads.map(thread => thread.id);
      // The very first thread has "scrolled above" the viewport + margin
      assert.deepEqual(visibleIds, [
        't2',
        't3',
        't4',
        't5',
        't6',
        't7',
        't8',
        't9',
        't10',
      ]);
      // That first thread's space...
      assert.equal(calculated.offscreenUpperHeight, 200);
      // The rest are rendered within viewport + lower margin, so:
      assert.equal(calculated.offscreenLowerHeight, 0);
    });

    describe('calculating visible threads without margins', () => {
      beforeEach(() => {
        fakeDefaultDimensions = {
          defaultHeight: 100,
          marginAbove: 0,
          marginBelow: 0,
        };
      });

      [
        {
          scrollPos: 0,
          windowHeight: 1000,
          expectedVisibleThreadIds: [
            't1',
            't2',
            't3',
            't4',
            't5',
            't6',
            't7',
            't8',
            't9',
            't10',
          ],
          offscreenUpperHeight: 0,
          offscreenLowerHeight: 0,
        },
        {
          scrollPos: 0,
          windowHeight: 100,
          expectedVisibleThreadIds: ['t1'],
          offscreenUpperHeight: 0,
          offscreenLowerHeight: 900,
        },
        {
          scrollPos: 101,
          windowHeight: 199,
          expectedVisibleThreadIds: ['t2', 't3'],
          offscreenUpperHeight: 100,
          offscreenLowerHeight: 700,
        },
      ].forEach(testCase => {
        it('should calculate the threads that would fit in the viewport', () => {
          const calculated = calculateVisibleThreads(
            fakeThreads,
            fakeThreadHeights,
            testCase.scrollPos,
            testCase.windowHeight,
            fakeDefaultDimensions
          );

          const visibleIds = calculated.visibleThreads.map(thread => thread.id);
          assert.deepEqual(visibleIds, testCase.expectedVisibleThreadIds);
          assert.equal(
            calculated.offscreenUpperHeight,
            testCase.offscreenUpperHeight
          );
          assert.equal(
            calculated.offscreenLowerHeight,
            testCase.offscreenLowerHeight
          );
        });
      });
    });
  });
});
