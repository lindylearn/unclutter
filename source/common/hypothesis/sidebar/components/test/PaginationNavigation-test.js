import { mount } from 'enzyme';
import { act } from 'preact/test-utils';

import { checkAccessibility } from '../../../test-util/accessibility';

import PaginationNavigation, { $imports } from '../PaginationNavigation';

describe('PaginationNavigation', () => {
  let fakeOnChangePage;
  let fakePageNumberOptions;

  const findButton = (wrapper, title) =>
    wrapper.find('button').filterWhere(n => n.props().title === title);

  const createComponent = (props = {}) => {
    return mount(
      <PaginationNavigation
        currentPage={1}
        onChangePage={fakeOnChangePage}
        totalPages={10}
        {...props}
      />
    );
  };

  beforeEach(() => {
    fakeOnChangePage = sinon.stub();
    fakePageNumberOptions = sinon.stub().returns([1, 2, 3, 4, null, 10]);

    $imports.$mock({
      '../util/pagination': { pageNumberOptions: fakePageNumberOptions },
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  describe('prev button', () => {
    it('should render a prev button when there are previous pages to show', () => {
      const wrapper = createComponent({ currentPage: 2 });

      const button = findButton(wrapper, 'Go to previous page');

      assert.isTrue(button.exists());
    });

    it('should not render a prev button if there are no previous pages to show', () => {
      const wrapper = createComponent({ currentPage: 1 });

      const button = findButton(wrapper, 'Go to previous page');

      assert.isFalse(button.exists());
    });

    it('should invoke the onChangePage callback when clicked', () => {
      const wrapper = createComponent({ currentPage: 2 });

      const button = findButton(wrapper, 'Go to previous page');

      button.simulate('click');

      assert.calledWith(fakeOnChangePage, 1);
    });

    it('should remove focus from button after clicked', () => {
      const wrapper = createComponent({ currentPage: 2 });

      const button = findButton(wrapper, 'Go to previous page');
      const buttonEl = button.getDOMNode();
      const blurSpy = sinon.spy(buttonEl, 'blur');

      act(() => {
        button.simulate('click');
      });

      assert.equal(blurSpy.callCount, 1);
    });
  });

  describe('next button', () => {
    it('should render a next button when there are further pages to show', () => {
      const wrapper = createComponent({ currentPage: 1 });

      const button = findButton(wrapper, 'Go to next page');

      assert.isTrue(button.exists());
    });

    it('should not render a next button if there are no further pages to show', () => {
      const wrapper = createComponent({ currentPage: 10 });

      const button = findButton(wrapper, 'Go to next page');

      assert.isFalse(button.exists());
    });

    it('should invoke the `onChangePage` callback when clicked', () => {
      const wrapper = createComponent({ currentPage: 1 });

      const button = findButton(wrapper, 'Go to next page');

      button.simulate('click');

      assert.calledWith(fakeOnChangePage, 2);
    });

    it('should remove focus from button after clicked', () => {
      const wrapper = createComponent({ currentPage: 1 });

      const button = findButton(wrapper, 'Go to next page');
      const buttonEl = button.getDOMNode();
      const blurSpy = sinon.spy(buttonEl, 'blur');

      act(() => {
        button.simulate('click');
      });

      assert.equal(blurSpy.callCount, 1);
    });
  });

  describe('page number buttons', () => {
    it('should render buttons for each page number available', () => {
      fakePageNumberOptions.returns([1, 2, 3, 4, null, 10]);

      const wrapper = createComponent();

      [1, 2, 3, 4, 10].forEach(pageNumber => {
        const button = findButton(wrapper, `Go to page ${pageNumber}`);

        assert.isTrue(button.exists());
      });

      // There is one "gap":
      assert.equal(wrapper.find('.PaginationNavigation__gap').length, 1);
    });

    it('should invoke the onChangePage callback when page number button clicked', () => {
      fakePageNumberOptions.returns([1, 2, 3, 4, null, 10]);

      const wrapper = createComponent();

      [1, 2, 3, 4, 10].forEach(pageNumber => {
        const button = findButton(wrapper, `Go to page ${pageNumber}`);

        button.simulate('click');

        assert.calledWith(fakeOnChangePage, pageNumber);
      });
    });
  });

  it(
    'should pass a11y checks',
    checkAccessibility({
      content: () => createComponent({ currentPage: 2 }),
    })
  );
});
