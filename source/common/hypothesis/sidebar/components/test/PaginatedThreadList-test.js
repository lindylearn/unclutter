import { mount } from 'enzyme';

import PaginatedThreadList, { $imports } from '../PaginatedThreadList';

import mockImportedComponents from '../../../test-util/mock-imported-components';

describe('PaginatedThreadList', () => {
  // Fake props
  let fakeOnChangePage;
  let fakeThreads;

  let threadCount;

  // Mocked dependencies
  let fakeCountVisible;

  function getNThreads(n) {
    // Fill an array with numbers 1...n
    // These can stand in for "Threads" in this component
    return [...Array(n + 1).keys()].slice(1);
  }

  function createComponent(props) {
    return mount(
      <PaginatedThreadList
        currentPage={1}
        isLoading={false}
        onChangePage={fakeOnChangePage}
        threads={fakeThreads}
        {...props}
      />
    );
  }

  beforeEach(() => {
    fakeOnChangePage = sinon.stub();
    // Every "thread" passed to the component will be considered visible
    fakeCountVisible = sinon.stub().returns(1);

    threadCount = 22;
    // Create an array populated with 1...n numbers
    fakeThreads = getNThreads(threadCount);

    $imports.$mock(mockImportedComponents());
    $imports.$mock({
      '../helpers/thread': { countVisible: fakeCountVisible },
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  const testCases = [
    {
      currentPage: 1,
      visibleThreads: 22,
      pageSize: 10,
      pageCount: 3,
      pageThreads: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    },
    {
      currentPage: 2,
      visibleThreads: 22,
      pageSize: 5,
      pageCount: 5,
      pageThreads: [6, 7, 8, 9, 10],
    },
    {
      currentPage: 2,
      visibleThreads: 20,
      pageSize: 10,
      pageCount: 2,
      pageThreads: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    },
    {
      currentPage: 1,
      visibleThreads: 2,
      pageSize: 10,
      pageCount: 1,
      pageThreads: [1, 2],
    },
    {
      currentPage: 3,
      visibleThreads: 455,
      pageSize: 10,
      pageCount: 46,
      pageThreads: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    },
    {
      currentPage: 3,
      visibleThreads: 51,
      pageSize: 25,
      pageCount: 3,
      pageThreads: [51],
    },
  ];

  testCases.forEach(testCase => {
    it('should calculate total pages of results based on visible threads', () => {
      const threads = getNThreads(testCase.visibleThreads);
      const componentProps = { currentPage: testCase.currentPage, threads };
      // This is to make sure the default-page-size code path is exercised in tests
      // (there must be a test with the specific pageSize)
      if (testCase.pageSize !== 25) {
        componentProps.pageSize = testCase.pageSize;
      }
      const wrapper = createComponent(componentProps);

      assert.equal(
        wrapper.find('PaginationNavigation').props().totalPages,
        testCase.pageCount
      );
    });

    it('passes current page through to pagination controls', () => {
      const threads = getNThreads(testCase.visibleThreads);
      const wrapper = createComponent({
        currentPage: testCase.currentPage,
        threads,
        pageSize: testCase.pageSize,
      });

      assert.equal(
        wrapper.find('PaginationNavigation').props().currentPage,
        testCase.currentPage
      );
    });

    it('passes threads for current page to thread list component', () => {
      const threads = getNThreads(testCase.visibleThreads);
      const wrapper = createComponent({
        currentPage: testCase.currentPage,
        threads,
        pageSize: testCase.pageSize,
      });

      assert.deepEqual(
        wrapper.find('ThreadList').props().threads,
        testCase.pageThreads
      );
    });
  });
});
