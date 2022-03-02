import { mount } from 'enzyme';

import { checkAccessibility } from '../../../../test-util/accessibility';
import mockImportedComponents from '../../../../test-util/mock-imported-components';

import AnnotationQuote, { $imports } from '../AnnotationQuote';

describe('AnnotationQuote', () => {
  let fakeAnnotation;
  let fakeIsOrphan;
  let fakeQuote;

  function createQuote(props) {
    return mount(
      <AnnotationQuote
        annotation={fakeAnnotation}
        isFocused={false}
        settings={{}}
        {...props}
      />
    );
  }

  beforeEach(() => {
    fakeAnnotation = {
      target: [],
    };

    fakeQuote = sinon.stub().returns('test quote');
    fakeIsOrphan = sinon.stub();

    $imports.$mock(mockImportedComponents());
    $imports.$mock({
      '../../helpers/annotation-metadata': {
        quote: fakeQuote,
        isOrphan: fakeIsOrphan,
      },
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  it('renders the quote', () => {
    const wrapper = createQuote();
    const quote = wrapper.find('blockquote');
    assert.equal(quote.text(), 'test quote');
  });

  it(
    'should pass a11y checks',
    checkAccessibility({
      content: () => createQuote(),
    })
  );
});
