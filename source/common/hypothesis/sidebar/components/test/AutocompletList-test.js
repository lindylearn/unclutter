import { mount } from 'enzyme';

import AutocompleteList from '../AutocompleteList';
import { $imports } from '../AutocompleteList';

import { checkAccessibility } from '../../../test-util/accessibility';
import mockImportedComponents from '../../../test-util/mock-imported-components';

describe('AutocompleteList', () => {
  let fakeList;
  let fakeOnSelectItem;
  let fakeListFormatter;
  function createComponent(props) {
    return mount(
      <AutocompleteList
        list={fakeList}
        onSelectItem={fakeOnSelectItem}
        {...props}
      />
    );
  }

  beforeEach(() => {
    fakeList = ['tag1', 'tag2'];
    fakeOnSelectItem = sinon.stub();
    fakeListFormatter = sinon.stub();
    $imports.$mock(mockImportedComponents());
  });

  afterEach(() => {
    $imports.$restore();
  });

  it('does not render the list when `open` is false', () => {
    const wrapper = createComponent();
    assert.isTrue(wrapper.find('.AutocompleteList').hasClass('is-hidden'));
  });

  it('does not render the list when `list` is empty', () => {
    const wrapper = createComponent({ open: true, list: [] });
    assert.isTrue(wrapper.find('.AutocompleteList').hasClass('is-hidden'));
  });

  it('sets unique keys to the <li> items', () => {
    const wrapper = createComponent({ open: true });
    assert.equal(wrapper.find('li').at(0).key(), 'AutocompleteList-0');
    assert.equal(wrapper.find('li').at(1).key(), 'AutocompleteList-1');
  });

  it('renders the items in order of the list prop', () => {
    const wrapper = createComponent({ open: true });
    assert.equal(wrapper.find('li').at(0).text(), 'tag1');
    assert.equal(wrapper.find('li').at(1).text(), 'tag2');
  });

  it('does not apply the `is-selected` class to items that are not selected', () => {
    const wrapper = createComponent({ open: true });
    assert.isFalse(wrapper.find('li.is-selected').exists());
  });

  it('applies `is-selected` class only to the <li> at the matching index', () => {
    const wrapper = createComponent({ open: true, activeItem: 0 });
    assert.isTrue(wrapper.find('li').at(0).hasClass('is-selected'));
    assert.isFalse(wrapper.find('li').at(1).hasClass('is-selected'));
  });

  it('calls `onSelect` when an <li> is clicked with the corresponding item', () => {
    const wrapper = createComponent({ open: true, activeItem: 0 });
    wrapper.find('li').at(0).simulate('click');
    assert.calledWith(fakeOnSelectItem, 'tag1');
  });

  it('calls `listFormatter` when building the <li> items if present', () => {
    createComponent({ open: true, listFormatter: fakeListFormatter });
    assert.calledWith(fakeListFormatter, 'tag1', 0);
    assert.calledWith(fakeListFormatter, 'tag2', 1);
  });

  it('adds the `id` attribute to <ul> only if its present', () => {
    let wrapper = createComponent({ open: true });
    assert.isNotOk(wrapper.find('ul').prop('id'));
    wrapper = createComponent({ open: true, id: 'AutocompleteList-id' });
    assert.equal(wrapper.find('ul').prop('id'), 'AutocompleteList-id');
  });

  it('creates unique ids on the <li> tags with the `itemPrefixId` only if its present', () => {
    let wrapper = createComponent({ open: true });
    assert.isNotOk(wrapper.find('li').at(0).prop('id'));
    wrapper = createComponent({ open: true, itemPrefixId: 'item-prefix-id-' });
    assert.equal(wrapper.find('li').at(0).prop('id'), 'item-prefix-id-0');
    assert.equal(wrapper.find('li').at(1).prop('id'), 'item-prefix-id-1');
  });

  it('sets the `aria-selected` attribute to "true" on the active item and "false" for all others', () => {
    const wrapper = createComponent({ open: true, activeItem: 0 });
    assert.equal(wrapper.find('li').at(0).prop('aria-selected'), 'true');

    assert.equal(wrapper.find('li').at(1).prop('aria-selected'), 'false');
  });

  it(
    'should pass a11y checks',
    checkAccessibility([
      {
        name: 'list open',
        content: () => {
          return createComponent({ open: true });
        },
      },
      {
        name: 'list open, first item selected',
        content: () => {
          return createComponent({ open: true, activeItem: 1 });
        },
      },
    ])
  );
});
