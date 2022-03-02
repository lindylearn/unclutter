import { createStore } from '../../create-store';
import sidebarPanels from '../sidebar-panels';

describe('sidebar/store/modules/sidebar-panels', () => {
  let store;

  const getSidebarPanelsState = () => {
    return store.getState().sidebarPanels;
  };

  beforeEach(() => {
    store = createStore([sidebarPanels]);
  });

  describe('#initialState', () => {
    it('sets initial `activePanelName` to `null`', () => {
      assert.equal(getSidebarPanelsState().activePanelName, null);
    });
  });

  describe('reducers', () => {
    describe('#OPEN_SIDEBAR_PANEL', () => {
      it('replaces `activePanelName` with passed `panelName`', () => {
        store.openSidebarPanel('foobar');

        assert.equal(getSidebarPanelsState().activePanelName, 'foobar');
      });
    });

    describe('#CLOSE_SIDEBAR_PANEL', () => {
      it('sets the active panel `null` if passed `panelName` is active panel', () => {
        store.openSidebarPanel('dingdong');
        store.closeSidebarPanel('dingdong');
        assert.equal(getSidebarPanelsState().activePanelName, null);
      });
      it('does not change the active panel if passed `panelName` is not the active panel', () => {
        store.openSidebarPanel('dingdong');
        store.closeSidebarPanel('somethingelse');
        assert.equal(getSidebarPanelsState().activePanelName, 'dingdong');
      });
    });

    describe('#TOGGLE_SIDEBAR_PANEL', () => {
      it('sets active panel to passed `panelName` if that panel is not the active panel already', () => {
        store.toggleSidebarPanel('dingdong');
        assert.equal(getSidebarPanelsState().activePanelName, 'dingdong');
      });

      it('sets active panel to `null` if passed `panelName` is the active panel already', () => {
        store.openSidebarPanel('dingdong');
        store.toggleSidebarPanel('dingdong');
        assert.equal(getSidebarPanelsState().activePanelName, null);
      });

      it('activates the given `panelName` if `activeState` is `true`', () => {
        store.openSidebarPanel('dingdong');
        store.toggleSidebarPanel('dingdong', true);
        assert.equal(getSidebarPanelsState().activePanelName, 'dingdong');
      });

      it('deactivates the given `panelName` if `activeState` is `false` and panel is active', () => {
        store.openSidebarPanel('dingdong');
        store.toggleSidebarPanel('dingdong', false);
        assert.equal(getSidebarPanelsState().activePanelName, null);
      });

      it('does not change active panel if `panelName` is not active and `activeState` is false', () => {
        store.openSidebarPanel('doodledoo');
        store.toggleSidebarPanel('dingdong', false);
        assert.equal(getSidebarPanelsState().activePanelName, 'doodledoo');
      });
    });
  });

  describe('selectors', () => {
    describe('#isSidebarPanelOpen', () => {
      it('returns `true` if `panelName` is the current active panel', () => {
        store.openSidebarPanel('dingdong');
        assert.isTrue(store.isSidebarPanelOpen('dingdong'));
      });

      it('returns `false` if `panelName` is not the current active panel', () => {
        store.openSidebarPanel('dingdong');
        assert.isFalse(store.isSidebarPanelOpen('broomstick'));
      });
    });
  });
});
