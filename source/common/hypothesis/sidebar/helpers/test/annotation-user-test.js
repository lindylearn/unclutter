import { annotationDisplayName } from '../annotation-user';

describe('sidebar/helpers/annotation-user', () => {
  const fakeAnnotations = {
    withDisplayName: {
      user: 'acct:albert@victoriana.com',
      user_info: { display_name: 'Albert, Prince Consort' },
    },
    noDisplayName: {
      user: 'acct:albert@victoriana.com',
      user_info: {},
    },
    noUserInfo: {
      user: 'acct:albert@victoriana.com',
    },
  };

  [
    {
      annotation: fakeAnnotations.withDisplayName,
      isThirdParty: false,
      isFeatureEnabled: false,
      expected: 'albert',
    },
    {
      annotation: fakeAnnotations.withDisplayName,
      isThirdParty: true,
      isFeatureEnabled: false,
      expected: 'Albert, Prince Consort',
    },
    {
      annotation: fakeAnnotations.withDisplayName,
      isThirdParty: false,
      isFeatureEnabled: true,
      expected: 'Albert, Prince Consort',
    },
    {
      annotation: fakeAnnotations.withDisplayName,
      isThirdParty: true,
      isFeatureEnabled: true,
      expected: 'Albert, Prince Consort',
    },
    {
      annotation: fakeAnnotations.noDisplayName,
      isThirdParty: true,
      isFeatureEnabled: true,
      expected: 'albert',
    },
    {
      annotation: fakeAnnotations.noUserInfo,
      isThirdParty: true,
      isFeatureEnabled: true,
      expected: 'albert',
    },
  ].forEach(testCase => {
    it('should return the appropriate author string for an annotation', () => {
      assert.equal(
        annotationDisplayName(
          testCase.annotation,
          testCase.isThirdParty,
          testCase.isFeatureEnabled
        ),
        testCase.expected
      );
    });
  });
});
