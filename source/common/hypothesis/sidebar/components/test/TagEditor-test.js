import { mount } from 'enzyme';
import { act } from 'preact/test-utils';

import AutocompleteList from '../AutocompleteList';
import TagEditor from '../TagEditor';
import { $imports } from '../TagEditor';

import { checkAccessibility } from '../../../test-util/accessibility';
import mockImportedComponents from '../../../test-util/mock-imported-components';

describe('TagEditor', () => {
  let containers = [];
  let fakeTags = ['tag1', 'tag2'];
  let fakeTagsService;
  let fakeServiceUrl;
  let fakeOnAddTag;
  let fakeOnRemoveTag;
  let fakeOnTagInput;

  function createComponent(props) {
    // Use an array of containers so we can test more
    // than one component at a time.
    let newContainer = document.createElement('div');
    containers.push(newContainer);
    document.body.appendChild(newContainer);
    return mount(
      <TagEditor
        // props
        onAddTag={fakeOnAddTag}
        onRemoveTag={fakeOnRemoveTag}
        onTagInput={fakeOnTagInput}
        tagList={fakeTags}
        // service props
        serviceUrl={fakeServiceUrl}
        tags={fakeTagsService}
        {...props}
      />,
      { attachTo: newContainer }
    );
  }

  beforeEach(() => {
    fakeOnAddTag = sinon.stub().returns(true);
    fakeOnRemoveTag = sinon.stub();
    fakeOnTagInput = sinon.stub();
    fakeServiceUrl = sinon.stub().returns('http://serviceurl.com');
    fakeTagsService = {
      filter: sinon.stub().returns(['tag4', 'tag3']),
    };
    $imports.$mock(mockImportedComponents());
  });

  afterEach(() => {
    containers.forEach(container => {
      container.remove();
    });
    containers = [];
    $imports.$restore();
  });

  // Simulates a selection event from AutocompleteList
  function selectOption(wrapper, item) {
    act(() => {
      wrapper.find('AutocompleteList').props().onSelectItem(item);
    });
  }

  // Various keydown simulation helper methods
  function selectOptionViaEnter(wrapper) {
    wrapper.find('input').simulate('keydown', { key: 'Enter' });
  }
  function selectOptionViaDelimiter(wrapper) {
    wrapper.find('input').simulate('keydown', { key: ',' });
  }
  function selectOptionViaTab(wrapper) {
    wrapper.find('input').simulate('keydown', { key: 'Tab' });
  }
  function navigateDown(wrapper) {
    wrapper.find('input').simulate('keydown', { key: 'ArrowDown' });
  }
  function navigateUp(wrapper) {
    wrapper.find('input').simulate('keydown', { key: 'ArrowUp' });
  }
  // Simulates typing text
  function typeInput(wrapper) {
    wrapper.find('input').simulate('input', { inputType: 'insertText' });
  }

  it('adds appropriate tag values to the elements', () => {
    const wrapper = createComponent();
    wrapper.find('li').forEach((tag, i) => {
      assert.isTrue(tag.hasClass('TagEditor__item'));
      assert.include(tag.text(), fakeTags[i]);
      assert.equal(tag.prop('aria-label'), `Tag: ${fakeTags[i]}`);
    });
  });

  it('generates an ordered AutocompleteList containing the array values returned from filter()', () => {
    const wrapper = createComponent();
    wrapper.find('input').instance().value = 'non-empty';
    typeInput(wrapper);
    assert.equal(wrapper.find('AutocompleteList').prop('list')[0], 'tag3');
    assert.equal(wrapper.find('AutocompleteList').prop('list')[1], 'tag4');
  });

  it('shows case-insensitive matches to suggested tags', () => {
    fakeTagsService.filter.returns(['fine AArdvark', 'AAArgh']);
    const wrapper = createComponent();
    wrapper.find('input').instance().value = 'aa';
    typeInput(wrapper);

    const formattingFn = wrapper.find('AutocompleteList').prop('listFormatter');
    const tagList = wrapper.find('AutocompleteList').prop('list');

    const firstSuggestedTag = mount(formattingFn(tagList[0]))
      .find('span')
      .text();
    const secondSuggestedTag = mount(formattingFn(tagList[1]))
      .find('span')
      .text();

    // Even though the entered text was lower case ('aa'), the suggested tag
    // should be rendered with its original casing (upper-case here)
    assert.equal(firstSuggestedTag, 'AAArgh');
    assert.equal(secondSuggestedTag, 'fine AArdvark');
  });

  it('shows suggested tags as-is if they do not seem to match the input', () => {
    // This case addresses a situation in which a substring match isn't found
    // for the current input text against a given suggested tag. This should not
    // happen in practice—i.e. filtered tags should match the current input—
    // but there is no contract that the tags service filtering uses the same
    // "matching" as the component, so we should be able to handle cases where
    // there doesn't "seem" to be a match by just rendering the suggested tag
    // as-is.
    fakeTagsService.filter.returns(['fine AArdvark', 'AAArgh']);
    const wrapper = createComponent();
    wrapper.find('input').instance().value = 'bb';
    typeInput(wrapper);

    const formattingFn = wrapper.find('AutocompleteList').prop('listFormatter');
    const tagList = wrapper.find('AutocompleteList').prop('list');

    const firstSuggestedTag = mount(formattingFn(tagList[0]))
      .find('span')
      .text();
    const secondSuggestedTag = mount(formattingFn(tagList[1]))
      .find('span')
      .text();

    // Obviously, these don't have a `bb` substring; we'll just render them...
    assert.equal(firstSuggestedTag, 'AAArgh');
    assert.equal(secondSuggestedTag, 'fine AArdvark');
  });

  it('passes the text value to filter() after receiving input', () => {
    const wrapper = createComponent();
    wrapper.find('input').instance().value = 'tag3';
    typeInput(wrapper);
    assert.isTrue(fakeTagsService.filter.calledOnce);
    assert.isTrue(fakeTagsService.filter.calledWith('tag3'));
  });

  describe('suggestions open / close', () => {
    it('closes the suggestions when selecting a tag from AutocompleteList', () => {
      const wrapper = createComponent();
      wrapper.find('input').instance().value = 'non-empty'; // to open list
      typeInput(wrapper);
      assert.equal(wrapper.find('AutocompleteList').prop('open'), true);
      selectOption(wrapper, 'tag4');
      wrapper.update();
      assert.equal(wrapper.find('AutocompleteList').prop('open'), false);
    });

    it('closes the suggestions when deleting <input> value', () => {
      const wrapper = createComponent();
      wrapper.find('input').instance().value = 'tag3';
      typeInput(wrapper);
      assert.equal(wrapper.find('AutocompleteList').prop('list').length, 2);
      wrapper.update();
      assert.equal(wrapper.find('AutocompleteList').prop('open'), true);
      wrapper.find('input').instance().value = ''; // clear input
      wrapper
        .find('input')
        .simulate('input', { inputType: 'deleteContentBackward' });
      assert.equal(wrapper.find('AutocompleteList').prop('open'), false);
    });

    it('does not close the suggestions when deleting only part of the <input> value', () => {
      const wrapper = createComponent();
      wrapper.find('input').instance().value = 'tag3';
      typeInput(wrapper);
      assert.equal(wrapper.find('AutocompleteList').prop('list').length, 2);
      assert.equal(wrapper.find('AutocompleteList').prop('open'), true);
      wrapper.find('input').instance().value = 't'; // non-empty input remains
      wrapper
        .find('input')
        .simulate('input', { inputType: 'deleteContentBackward' });
      assert.equal(wrapper.find('AutocompleteList').prop('open'), true);
    });

    it('opens the suggestions on focus if <input> is not empty', () => {
      const wrapper = createComponent();
      wrapper.find('input').instance().value = 'tag3';
      assert.equal(wrapper.find('AutocompleteList').prop('open'), false);
      wrapper.find('input').simulate('focus', {});
      assert.equal(wrapper.find('AutocompleteList').prop('open'), true);
    });

    it('does not open the suggestions on focus if <input> is empty', () => {
      const wrapper = createComponent();
      wrapper.find('input').simulate('focus', {});
      assert.equal(wrapper.find('AutocompleteList').prop('open'), false);
    });

    it('does not open the suggestions on focus if <input> value is only white space', () => {
      const wrapper = createComponent();
      wrapper.find('input').instance().value = ' ';
      wrapper.find('input').simulate('focus', {});
      assert.equal(wrapper.find('AutocompleteList').prop('open'), false);
    });

    it('closes the suggestions when focus is removed from the <input> field', () => {
      const wrapper = createComponent();
      wrapper.find('input').instance().value = 'non-empty';
      typeInput(wrapper);
      assert.equal(wrapper.find('AutocompleteList').prop('open'), true);
      document.body.dispatchEvent(new Event('focus'));
      wrapper.update();
      assert.equal(wrapper.find('AutocompleteList').prop('open'), false);
    });

    it('does not render duplicate suggestions', () => {
      // `tag3` supplied in the `tagList` will be a duplicate value relative
      // with the fakeTagsService.filter result above.
      const wrapper = createComponent({
        editMode: true,
        tagList: ['tag1', 'tag2', 'tag3'],
      });
      wrapper.find('input').instance().value = 'non-empty';
      typeInput(wrapper);
      assert.deepEqual(wrapper.find('AutocompleteList').prop('list'), ['tag4']);
    });
  });

  describe('when adding tags', () => {
    /**
     * Helper function to assert that a tag was correctly added
     */
    const assertAddTagsSuccess = (wrapper, tag) => {
      // called the onAddTags callback
      assert.calledOnce(fakeOnAddTag);
      assert.calledWith(fakeOnAddTag, tag);
      // hides the suggestions
      assert.equal(wrapper.find('AutocompleteList').prop('open'), false);
      // removes the selected index
      assert.equal(wrapper.find('AutocompleteList').prop('activeItem'), -1);
      // assert the input value is cleared out
      assert.equal(wrapper.find('input').instance().value, '');
      // input element should have focus
      assert.equal(document.activeElement.nodeName, 'INPUT');
    };

    it('adds a tag from the <input> field', () => {
      const wrapper = createComponent();
      selectOption(wrapper, 'tag3');
      assertAddTagsSuccess(wrapper, 'tag3');
      // Tag wasn't "typed in", so `onTagInput` will only be called once:
      // when the tag is successfully added and the pending tag is "cleared":
      assert.equal(fakeOnTagInput.callCount, 1);
      // This clears the pending tag
      assert.calledWith(fakeOnTagInput, '');
    });

    [
      [selectOptionViaEnter, 'Enter'],
      [selectOptionViaDelimiter, ','],
      [selectOptionViaTab, 'Tab'],
    ].forEach(keyAction => {
      it(`adds a tag from the <input> field when typing "${keyAction[1]}"`, () => {
        const wrapper = createComponent();
        wrapper.find('input').instance().value = 'umbrella';
        typeInput(wrapper); // opens suggestion list
        keyAction[0](wrapper);
        assertAddTagsSuccess(wrapper, 'umbrella');
        // The onTagInput callback will have been called twice: once when text
        // is "inputted" and once on adding the tag to clear the pending value
        assert.equal(fakeOnTagInput.callCount, 2);
        assert.calledWith(fakeOnTagInput, 'umbrella');
        assert.calledWith(fakeOnTagInput, '');
        // ensure focus is still on the input field
        assert.equal(document.activeElement.nodeName, 'INPUT');
      });
    });

    [
      [selectOptionViaEnter, 'Enter'],
      [selectOptionViaDelimiter, ','],
      [selectOptionViaTab, 'Tab'],
    ].forEach(keyAction => {
      it(`adds a tag from the suggestions list when typing "${keyAction[1]}"`, () => {
        const wrapper = createComponent();
        wrapper.find('input').instance().value = 't';
        typeInput(wrapper);
        // suggestions: [tag3, tag4]
        navigateDown(wrapper);
        keyAction[0](wrapper);
        assertAddTagsSuccess(wrapper, 'tag3');
        // ensure focus is still on the input field
        assert.equal(document.activeElement.nodeName, 'INPUT');
      });
    });

    context('When using the "Escape" key', () => {
      it('should clear tag text in <input> but retain focus', () => {
        const wrapper = createComponent();
        // Add and commit a tag
        wrapper.find('input').instance().value = 'thankyou';
        typeInput(wrapper);
        wrapper.find('input').simulate('keydown', { key: 'Tab' });
        // Type more text
        wrapper.find('input').instance().value = 'food';
        typeInput(wrapper);
        // // Now press escape
        wrapper.find('input').simulate('keydown', { key: 'Escape' });
        assert.equal(wrapper.find('input').instance().value, '');
        assert.equal(document.activeElement.nodeName, 'INPUT');
      });
    });

    context('When using the "Enter" key', () => {
      it('should invoke addTag callback even if input is empty', () => {
        const wrapper = createComponent();
        wrapper.find('input').instance().value = '';
        selectOptionViaEnter(wrapper);
        assertAddTagsSuccess(wrapper, '');
      });

      it('should invoke addTag callback even if <input> value is only white space', () => {
        const wrapper = createComponent();
        wrapper.find('input').instance().value = '  ';
        selectOptionViaEnter(wrapper);
        // Callback will be invoked with the _trimmed_ string
        assertAddTagsSuccess(wrapper, '');
      });
    });

    context('Using the "Tab" key', () => {
      it('should add the tag as typed when there are no suggestions', () => {
        const wrapper = createComponent();
        fakeTagsService.filter.returns([]);
        wrapper.find('input').instance().value = 'tag33';
        typeInput(wrapper);
        selectOptionViaTab(wrapper);
        assertAddTagsSuccess(wrapper, 'tag33');
        // ensure focus is still on the input field
        assert.equal(document.activeElement.nodeName, 'INPUT');
      });

      it('should add the tag as typed when there are multiple suggestions', () => {
        const wrapper = createComponent();
        fakeTagsService.filter.returns([]);
        wrapper.find('input').instance().value = 't';
        typeInput(wrapper);
        selectOptionViaTab(wrapper);
        assertAddTagsSuccess(wrapper, 't');
        // ensure focus is still on the input field
        assert.equal(document.activeElement.nodeName, 'INPUT');
      });

      it('should add the suggested tag when there is exactly one suggestion', () => {
        const wrapper = createComponent();
        fakeTagsService.filter.returns(['tag3']);
        wrapper.find('input').instance().value = 'tag';
        typeInput(wrapper);
        // suggestions: [tag3]
        selectOptionViaTab(wrapper);
        assertAddTagsSuccess(wrapper, 'tag3');
        // ensure focus is still on the input field
        assert.equal(document.activeElement.nodeName, 'INPUT');
      });

      it('should allow navigation out of field when there is no <input> value', () => {
        const wrapper = createComponent();
        wrapper.find('input').instance().value = '';
        typeInput(wrapper);
        selectOptionViaTab(wrapper);
        // Focus has moved
        assert.equal(document.activeElement.nodeName, 'BODY');
      });
    });

    describe('when removing tags', () => {
      it('removes `tag1` when clicking its delete button', () => {
        const wrapper = createComponent(); // note: initial tagList is ['tag1', 'tag2']
        assert.equal(wrapper.find('.TagEditor__edit').length, 2);
        wrapper
          .find('button')
          .at(0) // delete 'tag1'
          .simulate('click');

        assert.calledWith(fakeOnRemoveTag, 'tag1');
      });
    });

    describe('navigating suggestions via keyboard', () => {
      it('should set the initial `activeItem` value to -1 when opening suggestions', () => {
        const wrapper = createComponent();
        wrapper.find('input').instance().value = 'non-empty';
        typeInput(wrapper);
        assert.equal(wrapper.find('AutocompleteList').prop('open'), true);
        assert.equal(wrapper.find('AutocompleteList').prop('activeItem'), -1);
      });

      it('should increment the `activeItem` when pressing down circularly', () => {
        const wrapper = createComponent();
        wrapper.find('input').instance().value = 'non-empty';
        typeInput(wrapper);
        // 2 suggestions: ['tag3', 'tag4'];
        navigateDown(wrapper);
        assert.equal(wrapper.find('AutocompleteList').prop('activeItem'), 0);
        navigateDown(wrapper);
        assert.equal(wrapper.find('AutocompleteList').prop('activeItem'), 1);
        navigateDown(wrapper);
        // back to unselected
        assert.equal(wrapper.find('AutocompleteList').prop('activeItem'), -1);
      });

      it('should decrement the `activeItem` when pressing up circularly', () => {
        const wrapper = createComponent();
        wrapper.find('input').instance().value = 'non-empty';
        typeInput(wrapper);
        // 2 suggestions: ['tag3', 'tag4'];
        navigateUp(wrapper);
        assert.equal(wrapper.find('AutocompleteList').prop('activeItem'), 1);
        navigateUp(wrapper);
        assert.equal(wrapper.find('AutocompleteList').prop('activeItem'), 0);
        navigateUp(wrapper);
        assert.equal(wrapper.find('AutocompleteList').prop('activeItem'), -1);
      });

      it('should set `activeItem` to -1 when clearing the suggestions', () => {
        const wrapper = createComponent();
        wrapper.find('input').instance().value = 'non-empty';
        typeInput(wrapper);
        navigateDown(wrapper);
        // change to non-default value
        assert.equal(wrapper.find('AutocompleteList').prop('activeItem'), 0);
        // clear suggestions
        wrapper.find('input').instance().value = '';
        typeInput(wrapper);
        assert.equal(wrapper.find('AutocompleteList').prop('activeItem'), -1);
      });
    });
  });

  describe('accessibility attributes and ids', () => {
    it('creates multiple <TagEditor> components with unique AutocompleteList `id` props', () => {
      const wrapper1 = createComponent();
      const wrapper2 = createComponent();
      assert.notEqual(
        wrapper1.find('AutocompleteList').prop('id'),
        wrapper2.find('AutocompleteList').prop('id')
      );
    });

    it('sets the <AutocompleteList> `id` prop to the same value as the `aria-owns` attribute', () => {
      const wrapper = createComponent();
      wrapper.find('AutocompleteList');

      assert.equal(
        wrapper.find('.TagEditor__combobox-wrapper').prop('aria-owns'),
        wrapper.find('AutocompleteList').prop('id')
      );
    });

    it('sets `aria-expanded` value to match open state', () => {
      const wrapper = createComponent();
      wrapper.find('input').instance().value = 'non-empty'; // to open list
      typeInput(wrapper);
      assert.equal(
        wrapper.find('.TagEditor__combobox-wrapper').prop('aria-expanded'),
        'true'
      );
      selectOption(wrapper, 'tag4');
      wrapper.update();
      assert.equal(
        wrapper.find('.TagEditor__combobox-wrapper').prop('aria-expanded'),
        'false'
      );
    });

    it('sets the <AutocompleteList> `activeItem` prop to match the selected item index', () => {
      function checkAttributes(wrapper) {
        const activeDescendant = wrapper
          .find('input')
          .prop('aria-activedescendant');
        const itemPrefixId = wrapper
          .find('AutocompleteList')
          .prop('itemPrefixId');
        const activeDescendantIndex = activeDescendant.split(itemPrefixId);
        assert.equal(
          activeDescendantIndex[1],
          wrapper.find('AutocompleteList').prop('activeItem')
        );
      }

      const wrapper = createComponent();
      wrapper.find('input').instance().value = 'non-empty';
      typeInput(wrapper);
      // initial aria-activedescendant value is "" when index is -1
      assert.equal(wrapper.find('input').prop('aria-activedescendant'), '');
      // 2 suggestions: ['tag3', 'tag4'];
      navigateDown(wrapper); // press down once
      checkAttributes(wrapper);
      navigateDown(wrapper); // press down again once
      checkAttributes(wrapper);
    });
  });

  describe('accessibility validation', () => {
    beforeEach(() => {
      // create a full dom tree for a11y testing
      $imports.$mock({
        './AutocompleteList': AutocompleteList,
      });
    });

    it(
      'should pass a11y checks',
      checkAccessibility([
        {
          name: 'suggestions open',
          content: () => {
            const wrapper = createComponent();
            wrapper.find('input').instance().value = 'non-empty';
            typeInput(wrapper);
            return wrapper;
          },
        },
        {
          name: 'suggestions open, first item selected',
          content: () => {
            const wrapper = createComponent();
            wrapper.find('input').instance().value = 'non-empty';
            typeInput(wrapper);
            navigateDown(wrapper);
            return wrapper;
          },
        },
        {
          name: 'suggestions closed',
          content: () => {
            return createComponent();
          },
        },
      ])
    );
  });
});
