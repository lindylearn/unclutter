import { mount } from 'enzyme';

import * as fixtures from '../../../test/annotation-fixtures';

import { checkAccessibility } from '../../../../test-util/accessibility';
import mockImportedComponents from '../../../../test-util/mock-imported-components';

import AnnotationShareInfo, { $imports } from '../AnnotationShareInfo';

describe('AnnotationShareInfo', () => {
  let fakeGroup;
  let fakeStore;
  let fakeGetGroup;
  let fakeIsPrivate;

  const createAnnotationShareInfo = props => {
    return mount(
      <AnnotationShareInfo
        annotation={fixtures.defaultAnnotation()}
        {...props}
      />
    );
  };

  beforeEach(() => {
    fakeGroup = {
      name: 'My Group',
      links: {
        html: 'https://www.example.com',
      },
      type: 'private',
    };
    fakeGetGroup = sinon.stub().returns(fakeGroup);
    fakeStore = { getGroup: fakeGetGroup };
    fakeIsPrivate = sinon.stub().returns(false);

    $imports.$mock(mockImportedComponents());
    $imports.$mock({
      '../../store/use-store': { useStoreProxy: () => fakeStore },
      '../../helpers/permissions': { isPrivate: fakeIsPrivate },
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  describe('group link', () => {
    it('should show a link to the group for extant, first-party groups', () => {
      const wrapper = createAnnotationShareInfo();

      const groupLink = wrapper.find('a');

      assert.equal(groupLink.prop('href'), fakeGroup.links.html);
      assert.include(groupLink.text(), fakeGroup.name);
    });

    it('should display a group icon for private and restricted groups', () => {
      const wrapper = createAnnotationShareInfo();

      const groupIcon = wrapper.find('SvgIcon');

      assert.equal(groupIcon.prop('name'), 'groups');
    });

    it('should display a public/world icon for open groups', () => {
      fakeGroup.type = 'open';
      const wrapper = createAnnotationShareInfo();

      const groupIcon = wrapper.find('SvgIcon');

      assert.equal(groupIcon.prop('name'), 'public');
    });

    it('should not show a link to third-party groups', () => {
      // Third-party groups have no `html` link
      fakeGetGroup.returns({ name: 'A Group', links: {} });

      const wrapper = createAnnotationShareInfo();
      const groupLink = wrapper.find('.AnnotationShareInfo__group');

      assert.notOk(groupLink.exists());
    });

    it('should not show a link if no group available', () => {
      fakeGetGroup.returns(undefined);

      const wrapper = createAnnotationShareInfo();
      const groupLink = wrapper.find('.AnnotationShareInfo__group');

      assert.notOk(groupLink.exists());
    });
  });

  describe('"only you" information', () => {
    it('should not show privacy information if annotation is not private', () => {
      const wrapper = createAnnotationShareInfo();

      const privacy = wrapper.find('.AnnotationShareInfo__private');

      assert.notOk(privacy.exists());
    });

    context('private annotation', () => {
      beforeEach(() => {
        fakeIsPrivate.returns(true);
      });

      it('should show "only me" text for annotation in third-party group', () => {
        fakeGetGroup.returns({ name: 'Some Name', links: {} });
        const wrapper = createAnnotationShareInfo();

        const privacyText = wrapper.find('.AnnotationShareInfo__private-info');

        assert.isOk(privacyText.exists());
        assert.equal(privacyText.text(), 'Only me');
      });
    });
  });

  it(
    'should pass a11y checks',
    checkAccessibility({
      content: () => createAnnotationShareInfo(),
    })
  );
});
