import { mount } from 'enzyme';

import SearchInput from '../SearchInput';
import { $imports } from '../SearchInput';

import mockImportedComponents from '../../../test-util/mock-imported-components';
import { checkAccessibility } from '../../../test-util/accessibility';

describe('SearchInput', () => {
  let fakeStore;

  const createSearchInput = (props = {}) =>
    // `mount` rendering is used so we can get access to DOM nodes.
    mount(<SearchInput {...props} />);

  function typeQuery(wrapper, query) {
    const input = wrapper.find('input');
    input.getDOMNode().value = query;
    input.simulate('input');
  }

  beforeEach(() => {
    fakeStore = { isLoading: sinon.stub().returns(false) };

    $imports.$mock(mockImportedComponents());
    $imports.$mock({
      '../store/use-store': { useStoreProxy: () => fakeStore },
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  it('displays the active query', () => {
    const wrapper = createSearchInput({ query: 'foo' });
    assert.equal(wrapper.find('input').prop('value'), 'foo');
  });

  it('resets input field value to active query when active query changes', () => {
    const wrapper = createSearchInput({ query: 'foo' });

    // Simulate user editing the pending query, but not committing it.
    typeQuery(wrapper, 'pending-query');

    // Check that the pending query is displayed.
    assert.equal(wrapper.find('input').prop('value'), 'pending-query');

    // Simulate active query being reset.
    wrapper.setProps({ query: '' });

    assert.equal(wrapper.find('input').prop('value'), '');
  });

  it('invokes `onSearch` with pending query when form is submitted', () => {
    const onSearch = sinon.stub();
    const wrapper = createSearchInput({ query: 'foo', onSearch });
    typeQuery(wrapper, 'new-query');
    wrapper.find('form').simulate('submit');
    assert.calledWith(onSearch, 'new-query');
  });

  it('does not set an initial empty query when form is submitted', () => {
    // If the first query entered is empty, it will be ignored
    const onSearch = sinon.stub();
    const wrapper = createSearchInput({ onSearch });
    typeQuery(wrapper, '');
    wrapper.find('form').simulate('submit');
    assert.notCalled(onSearch);
  });

  it('sets subsequent empty queries if entered', () => {
    // If there has already been at least one query set, subsequent
    // empty queries will be honored
    const onSearch = sinon.stub();
    const wrapper = createSearchInput({ query: 'foo', onSearch });
    typeQuery(wrapper, '');
    wrapper.find('form').simulate('submit');
    assert.calledWith(onSearch, '');
  });

  it('renders loading indicator when app is in a "loading" state', () => {
    fakeStore.isLoading.returns(true);
    const wrapper = createSearchInput();
    assert.isTrue(wrapper.exists('Spinner'));
  });

  it('doesn\'t render search button when app is in "loading" state', () => {
    fakeStore.isLoading.returns(true);
    const wrapper = createSearchInput();
    assert.isFalse(wrapper.exists('button'));
  });

  it('doesn\'t render loading indicator when app is not in "loading" state', () => {
    fakeStore.isLoading.returns(false);
    const wrapper = createSearchInput();
    assert.isFalse(wrapper.exists('Spinner'));
  });

  it('renders search button when app is not in "loading" state', () => {
    fakeStore.isLoading.returns(false);
    const wrapper = createSearchInput();
    assert.isTrue(wrapper.exists('IconButton'));
  });

  it(
    'should pass a11y checks',
    checkAccessibility([
      {
        content: () => createSearchInput(),
      },
      {
        name: 'loading state',
        content: () => {
          fakeStore.isLoading.returns(true);
          return createSearchInput();
        },
      },
    ])
  );
});
