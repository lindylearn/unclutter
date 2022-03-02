import { findClosestOffscreenAnchor, anchorBuckets } from '../buckets';
import { $imports } from '../buckets';

function fakeAnchorFactory(
  offsetStart = 1,
  offsetIncrement = 100,
  boxHeight = 50
) {
  let highlightIndex = offsetStart;
  return () => {
    // In a normal `Anchor` object, `highlights` would be an array of
    // DOM elements. Here, `highlights[0]` is the vertical offset (top) of the
    // fake anchor's highlight box and `highlights[1]` is the height of the
    // box. This is in used in conjunction with the mock for
    // `getBoundingClientRect`, below
    const anchor = { highlights: [highlightIndex, boxHeight] };
    highlightIndex = highlightIndex + offsetIncrement;
    return anchor;
  };
}

describe('annotator/util/buckets', () => {
  let fakeGetBoundingClientRect;

  let fakeAnchors;
  let stubbedInnerHeight;

  beforeEach(() => {
    const fakeAnchor = fakeAnchorFactory();
    fakeAnchors = [
      fakeAnchor(), // top: 1, bottom: 51 — above screen
      fakeAnchor(), // top: 101, bottom: 151 — above screen
      fakeAnchor(), // top: 201, bottom: 251 — on screen
      fakeAnchor(), // top: 301, bottom: 351 — on screen
      fakeAnchor(), // top: 401, bottom: 451 — below screen
      fakeAnchor(), // top: 501, bottom: 551 - below screen
    ];
    stubbedInnerHeight = sinon.stub(window, 'innerHeight').value(410);

    fakeGetBoundingClientRect = sinon.stub().callsFake(highlights => {
      // Use the entries of the faked anchor's `highlights` array to
      // determine this anchor's "position"
      return {
        top: highlights[0],
        bottom: highlights[0] + highlights[1],
      };
    });

    $imports.$mock({
      '../highlighter': {
        getBoundingClientRect: fakeGetBoundingClientRect,
      },
    });
  });

  afterEach(() => {
    $imports.$restore();
    stubbedInnerHeight.restore();
  });

  describe('findClosestOffscreenAnchor', () => {
    it('finds the closest anchor above screen when headed up', () => {
      // fakeAnchors [0] and [1] are offscreen upwards, having `top` values
      // < BUCKET_TOP_THRESHOLD. [1] is closer so wins out. [3] and [4] are
      // "onscreen" already, or below where we want to go, anyway.
      assert.equal(
        findClosestOffscreenAnchor(fakeAnchors, 'up'),
        fakeAnchors[1]
      );
    });

    it('finds the closest anchor below screen when headed down', () => {
      // Our faked window.innerHeight here is 410, but the fake anchor with
      // top: 400 qualifies because it falls within BUCKET_NAV_SIZE of
      // the bottom of the window. It's closer to the screen than the last
      // anchor.
      assert.equal(
        findClosestOffscreenAnchor(fakeAnchors, 'down'),
        fakeAnchors[4]
      );
    });

    it('finds the right answer regardless of anchor order', () => {
      assert.equal(
        findClosestOffscreenAnchor(
          [fakeAnchors[3], fakeAnchors[1], fakeAnchors[4], fakeAnchors[0]],
          'up'
        ),
        fakeAnchors[1]
      );

      assert.equal(
        findClosestOffscreenAnchor(
          [fakeAnchors[4], fakeAnchors[2], fakeAnchors[3]],
          'down'
        ),
        fakeAnchors[4]
      );
    });

    it('ignores anchors with no highlights', () => {
      fakeAnchors.push({ highlights: [] });
      findClosestOffscreenAnchor(fakeAnchors, 'down');
      // It will disregard the anchor without the highlights and not try to
      // assess its boundingRect
      assert.equal(fakeGetBoundingClientRect.callCount, fakeAnchors.length - 1);
    });

    it('returns null if no valid anchor found', () => {
      stubbedInnerHeight = sinon.stub(window, 'innerHeight').value(800);
      assert.isNull(findClosestOffscreenAnchor([{ highlights: [] }], 'down'));
      assert.isNull(findClosestOffscreenAnchor(fakeAnchors, 'down'));
    });
  });

  describe('anchorBuckets', () => {
    it('puts anchors that are above the screen into the `above` bucket', () => {
      const bucketSet = anchorBuckets(fakeAnchors);
      assert.deepEqual(bucketSet.above.anchors, [
        fakeAnchors[0],
        fakeAnchors[1],
      ]);
    });

    it('puts anchors that are below the screen into the `below` bucket', () => {
      const bucketSet = anchorBuckets(fakeAnchors);
      assert.deepEqual(bucketSet.below.anchors, [
        fakeAnchors[4],
        fakeAnchors[5],
      ]);
    });

    it('puts on-screen anchors into a buckets', () => {
      const bucketSet = anchorBuckets(fakeAnchors);
      assert.deepEqual(bucketSet.buckets[0].anchors, [
        fakeAnchors[2],
        fakeAnchors[3],
      ]);
    });

    it('puts anchors into separate buckets if more than 60px separates their boxes', () => {
      fakeAnchors[2].highlights = [201, 15]; // bottom 216
      fakeAnchors[3].highlights = [301, 15]; // top 301 - more than 60px from 216
      const bucketSet = anchorBuckets(fakeAnchors);
      assert.deepEqual(bucketSet.buckets[0].anchors, [fakeAnchors[2]]);
      assert.deepEqual(bucketSet.buckets[1].anchors, [fakeAnchors[3]]);
    });

    it('puts overlapping anchors into a shared bucket', () => {
      fakeAnchors[2].highlights = [201, 200]; // Bottom 401
      fakeAnchors[3].highlights = [285, 100]; // Bottom 385
      const bucketSet = anchorBuckets(fakeAnchors);
      assert.deepEqual(bucketSet.buckets[0].anchors, [
        fakeAnchors[2],
        fakeAnchors[3],
      ]);
    });

    it('positions the bucket at vertical midpoint of the box containing all bucket anchors', () => {
      fakeAnchors[2].highlights = [200, 50]; // Top 200
      fakeAnchors[3].highlights = [225, 75]; // Bottom 300
      const bucketSet = anchorBuckets(fakeAnchors);
      assert.equal(bucketSet.buckets[0].position, 250);
    });

    it('only buckets annotations that have highlights', () => {
      const badAnchor = { highlights: [] };
      const bucketSet = anchorBuckets([badAnchor]);
      assert.equal(bucketSet.buckets.length, 0);
      assert.isEmpty(bucketSet.above.anchors); // Holder for above-screen anchors
      assert.isEmpty(bucketSet.below.anchors); // Holder for below-screen anchors
    });

    it('does not bucket annotations whose highlights have zero area', () => {
      const badAnchor = { highlights: [0, 0] };
      const bucketSet = anchorBuckets([badAnchor]);
      assert.equal(bucketSet.buckets.length, 0);
      assert.isEmpty(bucketSet.above.anchors);
      assert.isEmpty(bucketSet.below.anchors);
    });

    it('sorts anchors by top position', () => {
      const bucketSet = anchorBuckets([
        fakeAnchors[3],
        fakeAnchors[2],
        fakeAnchors[5],
        fakeAnchors[4],
        fakeAnchors[0],
        fakeAnchors[1],
      ]);
      assert.deepEqual(bucketSet.above.anchors, [
        fakeAnchors[0],
        fakeAnchors[1],
      ]);
      assert.deepEqual(bucketSet.buckets[0].anchors, [
        fakeAnchors[2],
        fakeAnchors[3],
      ]);
      assert.deepEqual(bucketSet.below.anchors, [
        fakeAnchors[4],
        fakeAnchors[5],
      ]);
    });

    it('returns only above- and below-screen anchors if none are on-screen', () => {
      // Push these anchors below screen
      fakeAnchors[2].highlights = [1000, 100];
      fakeAnchors[3].highlights = [1100, 75];
      fakeAnchors[4].highlights = [1200, 100];
      fakeAnchors[5].highlights = [1300, 75];
      const bucketSet = anchorBuckets(fakeAnchors);
      assert.equal(bucketSet.buckets.length, 0);
      // Above-screen
      assert.deepEqual(bucketSet.above.anchors, [
        fakeAnchors[0],
        fakeAnchors[1],
      ]);
      // Below-screen
      assert.deepEqual(bucketSet.below.anchors, [
        fakeAnchors[2],
        fakeAnchors[3],
        fakeAnchors[4],
        fakeAnchors[5],
      ]);
    });
  });
});
