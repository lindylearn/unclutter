import { mount } from 'enzyme';

import SortMenu from '../SortMenu';
import { $imports } from '../SortMenu';

import mockImportedComponents from '../../../test-util/mock-imported-components';

describe('SortMenu', () => {
  let fakeStore;

  const createSortMenu = () => {
    return mount(<SortMenu />);
  };

  beforeEach(() => {
    fakeStore = {
      setSortKey: sinon.stub(),
      sortKey: sinon.stub().returns('Location'),
      sortKeys: sinon.stub().returns(['Newest', 'Oldest', 'Location']),
    };

    $imports.$mock(mockImportedComponents());
    $imports.$mock({
      '../store/use-store': { useStoreProxy: () => fakeStore },
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  it('renders a menu item for each sort option', () => {
    const wrapper = createSortMenu();

    const menuItems = wrapper.find('MenuItem');

    assert.lengthOf(menuItems, fakeStore.sortKeys().length);
    fakeStore.sortKeys().forEach(sortKey => {
      assert.lengthOf(
        menuItems.filterWhere(menuItem => menuItem.prop('label') === sortKey),
        1
      );
    });
  });

  it('renders current sort key menu item as selected', () => {
    const wrapper = createSortMenu();

    const currentSortKeyMenuItem = wrapper
      .find('MenuItem')
      .filterWhere(menuItem => menuItem.prop('label') === fakeStore.sortKey());
    assert.isTrue(currentSortKeyMenuItem.prop('isSelected'));
  });

  it('sets the sort key via action when onClick callback invoked', () => {
    const wrapper = createSortMenu();
    const menuItems = wrapper.find('MenuItem');

    menuItems.forEach(menuItem => {
      const callback = menuItem.prop('onClick');

      callback();

      const lastCall = fakeStore.setSortKey.lastCall;
      assert.calledWith(lastCall, menuItem.prop('label'));
    });
  });
});
