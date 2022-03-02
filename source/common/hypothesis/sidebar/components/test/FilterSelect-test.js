import { mount } from 'enzyme';

import FilterSelect from '../FilterSelect';
import { $imports } from '../FilterSelect';

import { checkAccessibility } from '../../../test-util/accessibility';

import mockImportedComponents from '../../../test-util/mock-imported-components';

describe('FilterSelect', () => {
  let someOptions;
  const createComponent = props => {
    return mount(
      <FilterSelect
        defaultOption={{ value: '', display: 'all' }}
        onSelect={() => null}
        options={someOptions}
        title="Select one"
        {...props}
      />
    );
  };

  beforeEach(() => {
    someOptions = [
      { value: 'onevalue', display: 'One Value' },
      { value: 'twovalue', display: 'Two Value' },
    ];
    $imports.$mock(mockImportedComponents());
  });

  afterEach(() => {
    $imports.$restore();
  });

  it('should render option display values', () => {
    const wrapper = createComponent();

    const selectItems = wrapper.find('MenuItem');

    assert.equal(selectItems.length, 3);
    // First, the default option
    assert.deepEqual(selectItems.at(0).props().label, 'all');
    // Then the other options
    assert.deepEqual(selectItems.at(1).props().label, 'One Value');
    assert.deepEqual(selectItems.at(2).props().label, 'Two Value');
  });

  it('should invoke `onSelect` callback when an option is selected', () => {
    const fakeOnSelect = sinon.stub();

    const wrapper = createComponent({ onSelect: fakeOnSelect });

    const secondOption = wrapper.find('MenuItem').at(1);
    secondOption.props().onClick();

    assert.calledOnce(fakeOnSelect);
    assert.calledWith(
      fakeOnSelect,
      sinon.match({ value: 'onevalue', display: 'One Value' })
    );
  });

  it('should render provided icon and selected option in label', () => {
    const wrapper = createComponent({ icon: 'profile' });

    const label = mount(wrapper.find('Menu').props().label);
    const icon = label.find('SvgIcon');

    assert.isTrue(icon.exists());
    assert.equal(icon.props().name, 'profile');
    // Default option should be selected as we didn't indicate a selected option
    assert.include(label.text(), 'all');
  });

  it('should render provided title', () => {
    const wrapper = createComponent({ title: 'Select something' });

    assert.equal(wrapper.find('Menu').props().title, 'Select something');
  });

  it('should denote the selected option as selected', () => {
    const wrapper = createComponent({
      selectedOption: { value: 'twovalue', display: 'Two Value' },
    });

    const label = mount(wrapper.find('Menu').props().label);

    assert.equal(label.text(), 'Two Value');
    assert.isFalse(wrapper.find('MenuItem').at(1).props().isSelected);
    assert.isTrue(wrapper.find('MenuItem').at(2).props().isSelected);
  });

  it(
    'should pass a11y checks',
    checkAccessibility([
      {
        content: () => {
          $imports.$restore();
          return createComponent();
        },
      },
      {
        name: 'with icon',
        content: () => {
          $imports.$restore();
          return createComponent({
            icon: 'profile',
            title: 'Select something',
            selectedOption: { value: 'twovalue', display: 'Two Value' },
          });
        },
      },
    ])
  );
});
