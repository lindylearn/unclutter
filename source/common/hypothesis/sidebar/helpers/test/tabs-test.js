import * as fixtures from '../../test/annotation-fixtures';
import * as tabs from '../tabs';

describe('sidebar/helpers/tabs', () => {
  describe('tabForAnnotation', () => {
    [
      {
        ann: fixtures.defaultAnnotation(),
        expectedTab: 'annotation',
      },
      {
        ann: fixtures.oldPageNote(),
        expectedTab: 'note',
      },
      {
        ann: Object.assign(fixtures.defaultAnnotation(), { $orphan: true }),
        expectedTab: 'orphan',
      },
    ].forEach(testCase => {
      it(`shows annotation in correct tab (${testCase.expectedTab})`, () => {
        const ann = testCase.ann;
        const expectedTab = testCase.expectedTab;
        assert.equal(tabs.tabForAnnotation(ann), expectedTab);
      });
    });
  });

  describe('shouldShowInTab', () => {
    [
      {
        // Anchoring in progress.
        anchorTimeout: false,
        orphan: undefined,
        expectedTab: null,
      },
      {
        // Anchoring succeeded.
        anchorTimeout: false,
        orphan: false,
        expectedTab: 'annotation',
      },
      {
        // Anchoring failed.
        anchorTimeout: false,
        orphan: true,
        expectedTab: 'orphan',
      },
      {
        // Anchoring timed out.
        anchorTimeout: true,
        orphan: undefined,
        expectedTab: 'annotation',
      },
      {
        // Anchoring initially timed out but eventually
        // failed.
        anchorTimeout: true,
        orphan: true,
        expectedTab: 'orphan',
      },
    ].forEach(testCase => {
      it('returns true if the annotation should be shown', () => {
        const ann = fixtures.defaultAnnotation();
        ann.$anchorTimeout = testCase.anchorTimeout;
        ann.$orphan = testCase.orphan;

        assert.equal(
          tabs.shouldShowInTab(ann, 'annotation'),
          testCase.expectedTab === 'annotation'
        );
        assert.equal(
          tabs.shouldShowInTab(ann, 'orphan'),
          testCase.expectedTab === 'orphan'
        );
      });
    });
  });
});
