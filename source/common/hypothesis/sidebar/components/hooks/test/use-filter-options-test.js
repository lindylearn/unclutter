import { mount } from 'enzyme';

import { useUserFilterOptions } from '../use-filter-options';
import { $imports } from '../use-filter-options';

describe('sidebar/components/hooks/use-user-filter-options', () => {
  let fakeAccountId;
  let fakeStore;
  let fakeAnnotationUser;
  let lastUserOptions;

  // Mock `annotationDisplayName` as if it's returning display names
  let fakeAnnotationUserDisplay = annotation =>
    annotation.user_info.display_name;
  // Mock `annotationDisplayName` as if it's returning usernames
  let fakeAnnotationUserUsername = annotation => annotation.user;

  // Mount a dummy component to be able to use the hook
  function DummyComponent() {
    lastUserOptions = useUserFilterOptions();
  }

  function annotationFixtures() {
    return [
      {
        user: 'dingbat',
        user_info: { display_name: 'Ding Bat' },
      },
      {
        user: 'abalone',
        user_info: { display_name: 'Aba Lone' },
      },
      {
        user: 'bananagram',
        user_info: { display_name: 'Zerk' },
      },
      {
        user: 'dingbat',
        user_info: { display_name: 'Ding Bat' },
      },
    ];
  }

  beforeEach(() => {
    fakeAccountId = {
      username: sinon.stub().returnsArg(0),
    };

    fakeAnnotationUser = {
      annotationDisplayName: sinon.stub().callsFake(fakeAnnotationUserUsername),
    };

    fakeStore = {
      allAnnotations: sinon.stub().returns([]),
      defaultAuthority: sinon.stub().returns('foo.com'),
      getFocusFilters: sinon.stub().returns({}),
      isFeatureEnabled: sinon.stub().returns(false),
      profile: sinon.stub().returns({}),
    };

    $imports.$mock({
      '../../helpers/account-id': fakeAccountId,
      '../../helpers/annotation-user': fakeAnnotationUser,
      '../../store/use-store': { useStoreProxy: () => fakeStore },
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  it('should return a user filter option for each user who has authored an annotation', () => {
    fakeStore.allAnnotations.returns(annotationFixtures());

    mount(<DummyComponent />);

    assert.deepEqual(lastUserOptions, [
      { value: 'abalone', display: 'abalone' },
      { value: 'bananagram', display: 'bananagram' },
      { value: 'dingbat', display: 'dingbat' },
    ]);
  });

  it('sorts the current user to the front with " (Me)" suffix', () => {
    fakeStore.allAnnotations.returns(annotationFixtures());
    fakeStore.profile.returns({
      userid: 'bananagram',
    });

    mount(<DummyComponent />);

    assert.deepEqual(lastUserOptions, [
      { value: 'bananagram', display: 'bananagram (Me)' },
      { value: 'abalone', display: 'abalone' },
      { value: 'dingbat', display: 'dingbat' },
    ]);
  });

  it('does not add (Me)" suffix if user has no annotations', () => {
    fakeStore.allAnnotations.returns(annotationFixtures());
    fakeStore.profile.returns({
      userid: 'acct:fakeaccount@localhost',
    });

    mount(<DummyComponent />);

    assert.deepEqual(lastUserOptions, [
      { value: 'abalone', display: 'abalone' },
      { value: 'bananagram', display: 'bananagram' },
      { value: 'dingbat', display: 'dingbat' },
    ]);
  });

  describe('when focused-user filter is configured', () => {
    beforeEach(() => {
      fakeStore.getFocusFilters.returns({
        user: { value: 'carrotNumberOne', display: 'Number One Carrot' },
      });
    });

    it('should add focused-user filter information', () => {
      fakeStore.allAnnotations.returns(annotationFixtures());
      fakeAnnotationUser.annotationDisplayName.callsFake(
        fakeAnnotationUserDisplay
      );

      mount(<DummyComponent />);

      assert.deepEqual(lastUserOptions, [
        { value: 'abalone', display: 'Aba Lone' },
        { value: 'dingbat', display: 'Ding Bat' },
        { value: 'carrotNumberOne', display: 'Number One Carrot' },
        { value: 'bananagram', display: 'Zerk' },
      ]);
    });

    it('always uses display name for focused user', () => {
      fakeStore.allAnnotations.returns(annotationFixtures());
      fakeStore.getFocusFilters.returns({
        user: { value: 'carrotNumberOne', display: 'Numero Uno Zanahoria' },
      });

      mount(<DummyComponent />);

      assert.deepEqual(lastUserOptions, [
        { value: 'abalone', display: 'abalone' },
        { value: 'bananagram', display: 'bananagram' },
        { value: 'dingbat', display: 'dingbat' },
        { value: 'carrotNumberOne', display: 'Numero Uno Zanahoria' },
      ]);
    });

    it('sorts the current user to the front with " (Me)" suffix', () => {
      fakeAnnotationUser.annotationDisplayName.callsFake(
        fakeAnnotationUserDisplay
      );
      fakeStore.allAnnotations.returns(annotationFixtures());
      fakeStore.profile.returns({
        userid: 'bananagram',
      });

      mount(<DummyComponent />);

      assert.deepEqual(lastUserOptions, [
        { value: 'bananagram', display: 'Zerk (Me)' },
        { value: 'abalone', display: 'Aba Lone' },
        { value: 'dingbat', display: 'Ding Bat' },
        { value: 'carrotNumberOne', display: 'Number One Carrot' },
      ]);
    });

    it('does not add (Me)" suffix if user has no annotations', () => {
      fakeStore.allAnnotations.returns(annotationFixtures());
      fakeAnnotationUser.annotationDisplayName.callsFake(
        fakeAnnotationUserDisplay
      );
      fakeStore.profile.returns({
        userid: 'fakeid',
      });

      mount(<DummyComponent />);

      assert.deepEqual(lastUserOptions, [
        { value: 'abalone', display: 'Aba Lone' },
        { value: 'dingbat', display: 'Ding Bat' },
        { value: 'carrotNumberOne', display: 'Number One Carrot' },
        { value: 'bananagram', display: 'Zerk' },
      ]);
    });
  });
});
