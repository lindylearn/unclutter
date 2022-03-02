import { mount } from 'enzyme';

import * as fixtures from '../../../test/annotation-fixtures';

import { checkAccessibility } from '../../../../test-util/accessibility';
import mockImportedComponents from '../../../../test-util/mock-imported-components';

import AnnotationPublishControl, {
  $imports,
} from '../AnnotationPublishControl';

describe('AnnotationPublishControl', () => {
  let fakeGroup;
  let fakeMetadata;
  let fakeSettings;
  let fakeStore;
  let fakeApplyTheme;

  const createAnnotationPublishControl = (props = {}) => {
    return mount(
      <AnnotationPublishControl
        annotation={fixtures.defaultAnnotation()}
        isDisabled={false}
        onSave={sinon.stub()}
        settings={fakeSettings}
        {...props}
      />
    );
  };

  beforeEach(() => {
    fakeGroup = {
      name: 'Fake Group',
      type: 'private',
    };

    fakeMetadata = {
      isNew: sinon.stub(),
      isReply: sinon.stub().returns(false),
    };

    fakeSettings = {
      branding: {
        ctaTextColor: '#0f0',
        ctaBackgroundColor: '#00f',
      },
    };

    fakeStore = {
      createDraft: sinon.stub(),
      getDraft: sinon.stub().returns(fixtures.defaultDraft()),
      getGroup: sinon.stub().returns(fakeGroup),
      setDefault: sinon.stub(),
      removeAnnotations: sinon.stub(),
      removeDraft: sinon.stub(),
    };

    fakeApplyTheme = sinon.stub();

    $imports.$mock(mockImportedComponents());
    $imports.$mock({
      '../../store/use-store': { useStoreProxy: () => fakeStore },
      '../../helpers/annotation-metadata': fakeMetadata,
      '../../helpers/theme': {
        applyTheme: fakeApplyTheme,
      },
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  it('should not render if group is missing', () => {
    fakeStore.getGroup.returns(undefined);
    const wrapper = createAnnotationPublishControl();
    assert.isFalse(wrapper.find('.AnnotationPublishControl').exists());
  });

  const getPublishButton = wrapper =>
    wrapper.find('LabeledButton[data-testid="publish-control-button"]');

  describe('theming', () => {
    it('should apply theme styles', () => {
      const fakeStyle = { foo: 'bar' };
      fakeApplyTheme.returns(fakeStyle);
      const wrapper = createAnnotationPublishControl();
      const btnPrimary = getPublishButton(wrapper);

      assert.calledWith(
        fakeApplyTheme,
        ['ctaTextColor', 'ctaBackgroundColor'],
        fakeSettings
      );
      assert.include(btnPrimary.prop('style'), fakeStyle);
    });
  });

  describe('dropdown menu button (form submit button)', () => {
    context('shared annotation', () => {
      it('should label the button with the group name', () => {
        const wrapper = createAnnotationPublishControl();

        const btn = getPublishButton(wrapper);
        assert.equal(btn.text(), `Post to ${fakeGroup.name}`);
      });
    });

    context('private annotation', () => {
      it('should label the button with "Only Me"', () => {
        const draft = fixtures.defaultDraft();
        draft.isPrivate = true;
        fakeStore.getDraft.returns(draft);
        const wrapper = createAnnotationPublishControl();

        const btn = getPublishButton(wrapper);
        assert.equal(btn.text(), 'Post to Only Me');
      });
    });

    it('should disable the button if `isDisabled`', () => {
      const wrapper = createAnnotationPublishControl({ isDisabled: true });

      const btn = getPublishButton(wrapper);
      assert.isOk(btn.prop('disabled'));
    });

    it('should enable the button if not `isDisabled`', () => {
      const wrapper = createAnnotationPublishControl({ isDisabled: false });

      const btn = getPublishButton(wrapper);
      assert.isNotOk(btn.prop('disabled'));
    });

    it('should have a save callback', () => {
      const fakeOnSave = sinon.stub();
      const wrapper = createAnnotationPublishControl({ onSave: fakeOnSave });

      const btn = getPublishButton(wrapper);

      assert.equal(btn.prop('onClick'), fakeOnSave);
    });
  });

  describe('menu', () => {
    describe('share (to group) menu item', () => {
      it('should invoke privacy callback with shared privacy', () => {
        const wrapper = createAnnotationPublishControl();
        const shareMenuItem = wrapper.find('MenuItem').first();

        shareMenuItem.prop('onClick')();

        const call = fakeStore.createDraft.getCall(0);

        assert.calledOnce(fakeStore.createDraft);
        assert.isFalse(call.args[1].isPrivate);
      });

      it('should update default privacy level to shared', () => {
        const wrapper = createAnnotationPublishControl();
        const privateMenuItem = wrapper.find('MenuItem').first();

        privateMenuItem.prop('onClick')();

        assert.calledOnce(fakeStore.setDefault);
        assert.calledWith(fakeStore.setDefault, 'annotationPrivacy', 'shared');
      });

      it('should not update default privacy level if annotation is reply', () => {
        fakeMetadata.isReply.returns(true);
        const wrapper = createAnnotationPublishControl();
        const privateMenuItem = wrapper.find('MenuItem').first();

        privateMenuItem.prop('onClick')();

        assert.equal(fakeStore.setDefault.callCount, 0);
      });

      it('should have a label that is the name of the group', () => {
        const wrapper = createAnnotationPublishControl();
        const shareMenuItem = wrapper.find('MenuItem').first();

        assert.equal(shareMenuItem.prop('label'), fakeGroup.name);
      });

      context('private group', () => {
        it('should have a group icon', () => {
          const wrapper = createAnnotationPublishControl();
          const shareMenuItem = wrapper.find('MenuItem').first();

          assert.equal(shareMenuItem.prop('icon'), 'groups');
        });
      });
      context('open group', () => {
        beforeEach(() => {
          fakeGroup.type = 'open';
        });

        it('should have a public icon', () => {
          const wrapper = createAnnotationPublishControl();
          const shareMenuItem = wrapper.find('MenuItem').first();

          assert.equal(shareMenuItem.prop('icon'), 'public');
        });
      });
    });

    describe('private (only me) menu item', () => {
      it('should invoke callback with private privacy', () => {
        const wrapper = createAnnotationPublishControl();
        const privateMenuItem = wrapper.find('MenuItem').at(1);

        privateMenuItem.prop('onClick')();

        const call = fakeStore.createDraft.getCall(0);

        assert.calledOnce(fakeStore.createDraft);
        assert.isTrue(call.args[1].isPrivate);
      });

      it('should update default privacy level to private', () => {
        const wrapper = createAnnotationPublishControl();
        const privateMenuItem = wrapper.find('MenuItem').at(1);

        privateMenuItem.prop('onClick')();

        assert.calledOnce(fakeStore.setDefault);
        assert.calledWith(fakeStore.setDefault, 'annotationPrivacy', 'private');
      });

      it('should not update default privacy level if annotation is reply', () => {
        fakeMetadata.isReply.returns(true);
        const wrapper = createAnnotationPublishControl();
        const privateMenuItem = wrapper.find('MenuItem').at(1);

        privateMenuItem.prop('onClick')();

        assert.equal(fakeStore.setDefault.callCount, 0);
      });

      it('should use a private/lock icon', () => {
        const wrapper = createAnnotationPublishControl();
        const privateMenuItem = wrapper.find('MenuItem').at(1);

        assert.equal(privateMenuItem.prop('icon'), 'lock');
      });
      it('should have an "Only me" label', () => {
        const wrapper = createAnnotationPublishControl();
        const privateMenuItem = wrapper.find('MenuItem').at(1);

        assert.equal(privateMenuItem.prop('label'), 'Only Me');
      });
    });
  });

  describe('cancel button', () => {
    it('should remove the current draft on cancel button click', () => {
      const wrapper = createAnnotationPublishControl({});
      const cancelBtn = wrapper
        .find('LabeledButton')
        .filter({ icon: 'cancel' });

      cancelBtn.props().onClick();

      assert.calledOnce(fakeStore.removeDraft);
      assert.calledWith(fakeStore.removeDraft, wrapper.props().annotation);
      assert.equal(fakeStore.removeAnnotations.callCount, 0);
    });

    it('should remove the annotation from the store if it is new/unsaved', () => {
      fakeMetadata.isNew.returns(true);
      const wrapper = createAnnotationPublishControl({});
      const cancelBtn = wrapper
        .find('LabeledButton')
        .filter({ icon: 'cancel' });

      cancelBtn.props().onClick();

      assert.calledOnce(fakeStore.removeAnnotations);
    });
  });

  it(
    'should pass a11y checks',
    checkAccessibility({
      content: () => createAnnotationPublishControl(),
    })
  );
});
