import { mount } from 'enzyme';

import SelectionTabs from '../SelectionTabs';
import { $imports } from '../SelectionTabs';

import { checkAccessibility } from '../../../test-util/accessibility';
import mockImportedComponents from '../../../test-util/mock-imported-components';

describe('SelectionTabs', () => {
  // mock services
  let fakeAnnotationsService;
  let fakeSettings;
  let fakeStore;

  // default props
  const defaultProps = {
    isLoading: false,
  };

  function createComponent(props) {
    return mount(
      <SelectionTabs
        annotationsService={fakeAnnotationsService}
        settings={fakeSettings}
        {...defaultProps}
        {...props}
      />
    );
  }

  beforeEach(() => {
    fakeAnnotationsService = {
      createPageNote: sinon.stub(),
    };
    fakeSettings = {
      enableExperimentalNewNoteButton: false,
    };
    fakeStore = {
      clearSelection: sinon.stub(),
      selectTab: sinon.stub(),
      annotationCount: sinon.stub().returns(123),
      noteCount: sinon.stub().returns(456),
      orphanCount: sinon.stub().returns(0),
      isWaitingToAnchorAnnotations: sinon.stub().returns(false),
      selectedTab: sinon.stub().returns('annotation'),
    };

    $imports.$mock(mockImportedComponents());
    $imports.$mock({
      '../store/use-store': { useStoreProxy: () => fakeStore },
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  const unavailableMessage = wrapper =>
    wrapper.find('.SelectionTabs__message').text();

  it('should display the tabs and counts of annotations and notes', () => {
    const wrapper = createComponent();
    const tabs = wrapper.find('button');

    assert.include(tabs.at(0).text(), 'Annotations');
    assert.equal(tabs.at(0).find('.SelectionTabs__count').text(), 123);

    assert.include(tabs.at(1).text(), 'Page Notes');
    assert.equal(tabs.at(1).find('.SelectionTabs__count').text(), 456);
  });

  describe('Annotations tab', () => {
    it('should display annotations tab as selected when it is active', () => {
      const wrapper = createComponent();

      const tabs = wrapper.find('button');

      assert.isTrue(tabs.at(0).hasClass('is-selected'));
      assert.equal(tabs.at(0).prop('aria-selected'), 'true');
      assert.equal(tabs.at(1).prop('aria-selected'), 'false');
    });

    it('should not display the add-page-note button when the annotations tab is active', () => {
      fakeSettings.enableExperimentalNewNoteButton = true;
      const wrapper = createComponent();
      assert.equal(wrapper.find('LabeledButton').length, 0);
    });
  });

  describe('Notes tab', () => {
    it('should display notes tab as selected when it is active', () => {
      fakeStore.selectedTab.returns('note');
      const wrapper = createComponent();

      const tabs = wrapper.find('button');

      assert.isTrue(tabs.at(1).hasClass('is-selected'));
      assert.equal(tabs.at(1).prop('aria-selected'), 'true');
      assert.equal(tabs.at(0).prop('aria-selected'), 'false');
    });

    describe('Add Page Note button', () => {
      it('should not display the add-page-note button if the associated setting is not enabled', () => {
        fakeSettings.enableExperimentalNewNoteButton = false;
        fakeStore.selectedTab.returns('note');

        const wrapper = createComponent();

        assert.isFalse(wrapper.find('LabeledButton').exists());
      });

      it('should display the add-page-note button when the associated setting is enabled', () => {
        fakeSettings.enableExperimentalNewNoteButton = true;
        fakeStore.selectedTab.returns('note');

        const wrapper = createComponent();

        assert.isTrue(wrapper.find('LabeledButton').exists());
      });

      it('should apply background-color styling from settings', () => {
        fakeSettings = {
          branding: {
            ctaBackgroundColor: '#00f',
          },
          enableExperimentalNewNoteButton: true,
        };
        fakeStore.selectedTab.returns('note');

        const wrapper = createComponent();

        const button = wrapper.find('LabeledButton');
        assert.deepEqual(button.prop('style'), { backgroundColor: '#00f' });
      });

      it('should add a new page note on click', () => {
        fakeSettings.enableExperimentalNewNoteButton = true;
        fakeStore.selectedTab.returns('note');

        const wrapper = createComponent();
        wrapper.find('LabeledButton').props().onClick();

        assert.calledOnce(fakeAnnotationsService.createPageNote);
      });
    });
  });

  describe('orphans tab', () => {
    it('should display orphans tab if there is 1 or more orphans', () => {
      fakeStore.orphanCount.returns(1);

      const wrapper = createComponent();

      const tabs = wrapper.find('button');
      assert.equal(tabs.length, 3);
    });

    it('should display orphans tab as selected when it is active', () => {
      fakeStore.selectedTab.returns('orphan');
      fakeStore.orphanCount.returns(1);

      const wrapper = createComponent();

      const tabs = wrapper.find('button');
      assert.isTrue(tabs.at(2).hasClass('is-selected'));
      assert.equal(tabs.at(2).prop('aria-selected'), 'true');
      assert.equal(tabs.at(1).prop('aria-selected'), 'false');
      assert.equal(tabs.at(0).prop('aria-selected'), 'false');
    });

    it('should not display orphans tab if there are 0 orphans', () => {
      fakeStore.orphanCount.returns(0);

      const wrapper = createComponent();

      const tabs = wrapper.find('button');
      assert.equal(tabs.length, 2);
    });
  });

  describe('tab display and counts', () => {
    it('should render `title` and `aria-label` attributes for tab buttons, with counts', () => {
      fakeStore.orphanCount.returns(1);
      const wrapper = createComponent();

      const tabs = wrapper.find('button');

      assert.equal(
        tabs.at(0).prop('aria-label'),
        'Annotations (123 available)'
      );
      assert.equal(tabs.at(0).prop('title'), 'Annotations (123 available)');
      assert.equal(tabs.at(1).prop('aria-label'), 'Page notes (456 available)');
      assert.equal(tabs.at(1).prop('title'), 'Page notes (456 available)');
      assert.equal(tabs.at(2).prop('aria-label'), 'Orphans (1 available)');
      assert.equal(tabs.at(2).prop('title'), 'Orphans (1 available)');
    });

    it('should not render count in `title` and `aria-label` for page notes tab if there are no page notes', () => {
      fakeStore.noteCount.returns(0);

      const wrapper = createComponent({});

      const tabs = wrapper.find('button');

      assert.equal(tabs.at(1).prop('aria-label'), 'Page notes');
      assert.equal(tabs.at(1).prop('title'), 'Page notes');
    });

    it('should not display a message when its loading annotation count is 0', () => {
      fakeStore.annotationCount.returns(0);
      const wrapper = createComponent({
        isLoading: true,
      });
      assert.isFalse(wrapper.exists('.annotation-unavailable-message__label'));
    });

    it('should not display a message when its loading notes count is 0', () => {
      fakeStore.selectedTab.returns('note');
      fakeStore.noteCount.returns(0);
      const wrapper = createComponent({
        isLoading: true,
      });
      assert.isFalse(wrapper.exists('.SelectionTabs__message'));
    });

    it('should not display the longer version of the no annotations message when there are no annotations and isWaitingToAnchorAnnotations is true', () => {
      fakeStore.annotationCount.returns(0);
      fakeStore.isWaitingToAnchorAnnotations.returns(true);
      const wrapper = createComponent({
        isLoading: false,
      });
      assert.isFalse(wrapper.exists('.SelectionTabs__message'));
    });

    it('should display the longer version of the no notes message when there are no notes', () => {
      fakeStore.selectedTab.returns('note');
      fakeStore.noteCount.returns(0);
      const wrapper = createComponent({});
      assert.include(
        unavailableMessage(wrapper),
        'There are no page notes in this group.'
      );
    });

    it('should display the longer version of the no annotations message when there are no annotations', () => {
      fakeStore.annotationCount.returns(0);
      const wrapper = createComponent({});
      assert.include(
        unavailableMessage(wrapper),
        'There are no annotations in this group.'
      );
      assert.include(
        unavailableMessage(wrapper),
        'Create one by selecting some text and clicking the'
      );
    });
  });

  const findButton = (wrapper, label) =>
    wrapper.findWhere(
      el => el.type() === 'button' && el.text().includes(label)
    );

  [
    { label: 'Annotations', tab: 'annotation' },
    { label: 'Page Notes', tab: 'note' },
    { label: 'Orphans', tab: 'orphan' },
  ].forEach(({ label, tab }) => {
    it(`should change the selected tab when "${label}" tab is clicked`, () => {
      // Pre-select a different tab than the one we are about to click.
      fakeStore.selectedTab.returns('other-tab');

      // Make the "Orphans" tab appear.
      fakeStore.orphanCount.returns(1);
      const wrapper = createComponent({});

      findButton(wrapper, label).simulate('click');

      assert.calledOnce(fakeStore.clearSelection);
      assert.calledWith(fakeStore.selectTab, tab);
    });
  });

  it('does not change the selected tab if it is already selected', () => {
    fakeStore.selectedTab.returns('note');
    const wrapper = createComponent({});

    findButton(wrapper, 'Page Notes').simulate('click');

    assert.notCalled(fakeStore.clearSelection);
    assert.notCalled(fakeStore.selectTab);
  });

  it(
    'should pass a11y checks',
    checkAccessibility({
      content: () => {
        fakeStore.annotationCount.returns(1);
        fakeStore.noteCount.returns(2);
        fakeStore.orphanCount.returns(3);
        return createComponent({});
      },
    })
  );
});
