import { mount } from 'enzyme';

import TagList from '../TagList';
import { $imports } from '../TagList';

import { checkAccessibility } from '../../../test-util/accessibility';
import mockImportedComponents from '../../../test-util/mock-imported-components';

describe('TagList', () => {
  let fakeIsThirdPartyUser;
  let fakeStore;
  const fakeTags = ['tag1', 'tag2'];

  function createComponent(props) {
    return mount(<TagList annotation={{}} tags={fakeTags} {...props} />);
  }

  beforeEach(() => {
    fakeIsThirdPartyUser = sinon.stub().returns(false);

    fakeStore = {
      defaultAuthority: sinon.stub().returns('hypothes.is'),
      getLink: sinon.stub().returns('http://serviceurl.com'),
    };

    $imports.$mock(mockImportedComponents());
    $imports.$mock({
      '../helpers/account-id': {
        isThirdPartyUser: fakeIsThirdPartyUser,
      },
      '../store/use-store': { useStoreProxy: () => fakeStore },
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  it('does not render any tags if `tags` prop is empty', () => {
    const wrapper = createComponent({ tags: [] });
    assert.isFalse(wrapper.find('.TagList__item a').exists());
  });

  context('when `isThirdPartyUser` returns false', () => {
    it('adds appropriate classes, props and values', () => {
      const wrapper = createComponent();
      wrapper.find('a').forEach((link, i) => {
        assert.isTrue(link.hasClass('TagList__link'));
        assert.equal(link.prop('aria-label'), `Tag: ${fakeTags[i]}`);
        assert.equal(link.prop('href'), 'http://serviceurl.com');
        assert.equal(
          link.prop('title'),
          `View annotations with tag: ${fakeTags[i]}`
        );
        assert.equal(link.text(), fakeTags[i]);
      });
    });

    it('gets the links for tags', () => {
      createComponent();
      assert.calledWith(fakeStore.getLink, 'search.tag', { tag: 'tag1' });
      assert.calledWith(fakeStore.getLink, 'search.tag', { tag: 'tag2' });
    });
  });

  context('when `isThirdPartyUser` returns true', () => {
    beforeEach(() => {
      fakeIsThirdPartyUser.returns(true);
    });

    it('adds appropriate classes, props and values', () => {
      const wrapper = createComponent();
      wrapper.find('span').forEach((link, i) => {
        assert.isTrue(link.hasClass('TagList__text'));
        assert.equal(link.prop('aria-label'), `Tag: ${fakeTags[i]}`);
        assert.equal(link.text(), fakeTags[i]);
      });
    });

    it('does not fetch tag link', () => {
      createComponent();
      assert.notCalled(fakeStore.getLink);
    });
  });

  it(
    'should pass a11y checks',
    checkAccessibility([
      {
        name: 'first-party user',
        content: () => createComponent({ tags: ['tag1', 'tag2'] }),
      },
      {
        name: 'third-party user',
        content: () => {
          fakeIsThirdPartyUser.returns(true);
          return createComponent({ tags: ['tag1', 'tag2'] });
        },
      },
    ])
  );
});
