import * as threadUtil from '../thread';

describe('sidebar/helpers/thread', () => {
  const fakeThread = () => {
    return {
      annotation: {},
      visible: true,
      children: [
        {
          annotation: {},
          visible: true,
          children: [
            { annotation: {}, visible: true, children: [] },
            { annotation: {}, visible: false, children: [] },
          ],
        },
        {
          annotation: {},
          visible: false,
          children: [{ annotation: {}, visible: true, children: [] }],
        },
        { annotation: {}, visible: true, children: [] },
      ],
    };
  };

  describe('countVisible', () => {
    it('should count the number of visible entries in the thread', () => {
      const thread = fakeThread();
      assert.equal(threadUtil.countVisible(thread), 5);
    });

    it('should calculate visible entries when top-level thread is hidden', () => {
      const thread = fakeThread();
      thread.visible = false;

      assert.equal(threadUtil.countVisible(thread), 4);
    });
  });

  describe('countHidden', () => {
    it('should count the number of hidden entries in the thread', () => {
      const thread = fakeThread();
      assert.equal(threadUtil.countHidden(thread), 2);
    });

    it('should calculate visible entries when top-level thread is hidden', () => {
      const thread = fakeThread();
      thread.visible = false;

      assert.equal(threadUtil.countHidden(thread), 3);
    });
  });

  describe('rootAnnotations', () => {
    it("returns all of the annotations in the thread's child threads if there is at least one annotation present", () => {
      const fixture = {
        children: [
          { annotation: 1, children: [] },
          { children: [] },
          { annotation: 2, children: [] },
        ],
      };
      assert.deepEqual(threadUtil.rootAnnotations(fixture.children), [1, 2]);
    });

    it('returns all of the annotations at the first depth that has any annotations', () => {
      const fixture = {
        children: [
          {
            children: [
              { annotation: 1, children: [] },
              { children: [] },
              { annotation: 2, children: [] },
            ],
          },
          { children: [{ children: [{ annotation: 3, children: [] }] }] },
          { children: [{ annotation: 4, children: [] }] },
        ],
      };

      assert.deepEqual(threadUtil.rootAnnotations(fixture.children), [1, 2, 4]);
    });

    it('throws an exception if fed a thread hierarchy with no annotations', () => {
      const fixture = {
        children: [{ children: [{ children: [] }] }],
      };

      assert.throws(() => {
        threadUtil.rootAnnotations(fixture.children);
      }, /Thread contains no annotations/);
    });
  });
});
