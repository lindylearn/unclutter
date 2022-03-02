import * as sessionUtil from '../session';

describe('sidebar/helpers/session', () => {
  describe('#shouldShowSidebarTutorial', () => {
    it('shows sidebar tutorial if the settings object has the show_sidebar_tutorial key set', () => {
      const sessionState = {
        preferences: {
          show_sidebar_tutorial: true,
        },
      };

      assert.isTrue(sessionUtil.shouldShowSidebarTutorial(sessionState));
    });

    it('hides sidebar tutorial if the settings object does not have the show_sidebar_tutorial key set', () => {
      const sessionState = {
        preferences: {
          show_sidebar_tutorial: false,
        },
      };

      assert.isFalse(sessionUtil.shouldShowSidebarTutorial(sessionState));
    });
  });

  describe('#shouldAutoDisplayTutorial', () => {
    [
      {
        // The only "true" state
        description: 'in sidebar with loaded user preference to show tutorial',
        isSidebar: true,
        sessionState: { preferences: { show_sidebar_tutorial: true } },
        settings: {},
        expected: true,
      },
      {
        description: 'in sidebar with no loaded user profile',
        isSidebar: true,
        sessionState: {},
        settings: {},
        expected: false,
      },
      {
        description: 'not in sidebar with no loaded user profile',
        isSidebar: false,
        sessionState: {},
        settings: {},
        expected: false,
      },
      {
        description:
          'in sidebar with loaded user preference not to show tutorial',
        isSidebar: true,
        sessionState: { preferences: { show_sidebar_tutorial: false } },
        settings: {},
        expected: false,
      },
      {
        description:
          'in sidebar with loaded user preference to show tutorial and configured help service',
        isSidebar: true,
        sessionState: { preferences: { show_sidebar_tutorial: true } },
        settings: { services: [{ onHelpRequestProvided: true }] },
        expected: false,
      },
      {
        description:
          'not in sidebar with loaded user preference to show tutorial and configured help service',
        isSidebar: false,
        sessionState: { preferences: { show_sidebar_tutorial: true } },
        settings: { services: [{ onHelpRequestProvided: true }] },
        expected: false,
      },
      {
        description:
          'not in sidebar with no loaded user profile and configured help service',
        isSidebar: false,
        sessionState: {},
        settings: { services: [{ onHelpRequestProvided: true }] },
        expected: false,
      },
    ].forEach(fixture => {
      it(`should calculate auto-display to be ${fixture.expected} when ${fixture.description}`, () => {
        const shouldDisplay = sessionUtil.shouldAutoDisplayTutorial(
          fixture.isSidebar,
          fixture.sessionState,
          fixture.settings
        );
        assert.equal(shouldDisplay, fixture.expected);
      });
    });
  });
});
