import * as fixtures from '../../test/annotation-fixtures';

import { AnnotationsService, $imports } from '../annotations';

describe('AnnotationsService', () => {
  let fakeApi;
  let fakeMetadata;
  let fakeStore;

  let fakeDefaultPermissions;
  let fakePrivatePermissions;
  let fakeSharedPermissions;

  let svc;

  beforeEach(() => {
    fakeApi = {
      annotation: {
        create: sinon.stub().resolves(fixtures.defaultAnnotation()),
        delete: sinon.stub().resolves(),
        flag: sinon.stub().resolves(),
        update: sinon.stub().resolves(fixtures.defaultAnnotation()),
      },
    };

    fakeDefaultPermissions = sinon.stub();
    fakePrivatePermissions = sinon.stub();
    fakeSharedPermissions = sinon.stub();

    fakeMetadata = {
      isAnnotation: sinon.stub(),
      isHighlight: sinon.stub(),
      isNew: sinon.stub(),
      isPageNote: sinon.stub(),
      isPublic: sinon.stub(),
    };

    fakeStore = {
      addAnnotations: sinon.stub(),
      annotationSaveFinished: sinon.stub(),
      annotationSaveStarted: sinon.stub(),
      createDraft: sinon.stub(),
      deleteNewAndEmptyDrafts: sinon.stub(),
      focusedGroupId: sinon.stub().returns('test-group'),
      getDefault: sinon.stub(),
      getDraft: sinon.stub().returns(null),
      isLoggedIn: sinon.stub().returns(true),
      mainFrame: sinon.stub().returns({ uri: 'http://www.example.com' }),
      openSidebarPanel: sinon.stub(),
      profile: sinon.stub().returns({}),
      removeAnnotations: sinon.stub(),
      removeDraft: sinon.stub(),
      selectTab: sinon.stub(),
      setExpanded: sinon.stub(),
      updateFlagStatus: sinon.stub(),
    };

    $imports.$mock({
      '../helpers/annotation-metadata': fakeMetadata,
      '../helpers/permissions': {
        defaultPermissions: fakeDefaultPermissions,
        privatePermissions: fakePrivatePermissions,
        sharedPermissions: fakeSharedPermissions,
      },
    });

    svc = new AnnotationsService(fakeApi, fakeStore);
  });

  afterEach(() => {
    $imports.$restore();
  });

  const getLastAddedAnnotation = () => {
    if (fakeStore.addAnnotations.callCount <= 0) {
      return null;
    }
    const callCount = fakeStore.addAnnotations.callCount;
    return fakeStore.addAnnotations.getCall(callCount - 1).args[0][0];
  };

  describe('create', () => {
    let now;

    beforeEach(() => {
      now = new Date();

      fakeStore.focusedGroupId.returns('mygroup');
      fakeStore.profile.returns({
        userid: 'acct:foo@bar.com',
        user_info: {},
      });
    });

    it('extends the provided annotation object with defaults', () => {
      fakeStore.focusedGroupId.returns('mygroup');

      svc.create({}, now);

      const annotation = getLastAddedAnnotation();

      assert.equal(annotation.created, now.toISOString());
      assert.equal(annotation.group, 'mygroup');
      assert.isArray(annotation.tags);
      assert.isEmpty(annotation.tags);
      assert.isString(annotation.text);
      assert.isEmpty(annotation.text);
      assert.equal(annotation.updated, now.toISOString());
      assert.equal(annotation.user, 'acct:foo@bar.com');
      assert.isOk(annotation.$tag);
      assert.isString(annotation.$tag);
    });

    describe('annotation permissions', () => {
      it('sets private permissions if default privacy level is "private"', () => {
        fakeStore.getDefault.returns('private');
        fakeDefaultPermissions.returns('private-permissions');

        svc.create({}, now);
        const annotation = getLastAddedAnnotation();

        assert.calledOnce(fakeDefaultPermissions);
        assert.calledWith(
          fakeDefaultPermissions,
          'acct:foo@bar.com',
          'mygroup',
          'private'
        );
        assert.equal(annotation.permissions, 'private-permissions');
      });

      it('sets shared permissions if default privacy level is "shared"', () => {
        fakeStore.getDefault.returns('shared');
        fakeDefaultPermissions.returns('default permissions');

        svc.create({}, now);
        const annotation = getLastAddedAnnotation();

        assert.calledOnce(fakeDefaultPermissions);
        assert.calledWith(
          fakeDefaultPermissions,
          'acct:foo@bar.com',
          'mygroup',
          'shared'
        );
        assert.equal(annotation.permissions, 'default permissions');
      });

      it('sets private permissions if annotation is a highlight', () => {
        fakeMetadata.isHighlight.returns(true);
        fakePrivatePermissions.returns('private permissions');
        fakeDefaultPermissions.returns('default permissions');

        svc.create({}, now);
        const annotation = getLastAddedAnnotation();

        assert.calledOnce(fakePrivatePermissions);
        assert.equal(annotation.permissions, 'private permissions');
      });
    });

    it('creates a draft for the new annotation', () => {
      fakeMetadata.isHighlight.returns(false);

      svc.create(fixtures.newAnnotation(), now);

      assert.calledOnce(fakeStore.createDraft);
    });

    it('adds the annotation to the store', () => {
      svc.create(fixtures.newAnnotation(), now);

      assert.calledOnce(fakeStore.addAnnotations);
    });

    it('deletes other empty drafts for new annotations', () => {
      svc.create(fixtures.newAnnotation(), now);

      assert.calledOnce(fakeStore.deleteNewAndEmptyDrafts);
    });

    it('does not create a draft if the annotation is a highlight', () => {
      fakeMetadata.isHighlight.returns(true);

      svc.create(fixtures.newAnnotation(), now);

      assert.notCalled(fakeStore.createDraft);
    });

    describe('automatic tab selection', () => {
      it('sets the active tab to "Page Notes" if the annotation is a Page Note', () => {
        fakeMetadata.isPageNote.returns(true);

        svc.create(fixtures.newAnnotation(), now);

        assert.calledOnce(fakeStore.selectTab);
        assert.calledWith(fakeStore.selectTab, 'note');
      });

      it('sets the active tab to "Annotations" if the annotation is an annotation', () => {
        fakeMetadata.isAnnotation.returns(true);

        svc.create(fixtures.newAnnotation(), now);

        assert.calledOnce(fakeStore.selectTab);
        assert.calledWith(fakeStore.selectTab, 'annotation');
      });

      it('does nothing if the annotation is neither an annotation nor a page note (e.g. reply)', () => {
        fakeMetadata.isAnnotation.returns(false);
        fakeMetadata.isPageNote.returns(false);

        svc.create(fixtures.newAnnotation(), now);

        assert.notCalled(fakeStore.selectTab);
      });
    });

    it("expands all of the new annotation's parents", () => {
      const annot = fixtures.newAnnotation();
      annot.references = ['aparent', 'anotherparent', 'yetanotherancestor'];

      svc.create(annot, now);

      assert.equal(fakeStore.setExpanded.callCount, 3);
      assert.calledWith(fakeStore.setExpanded, 'aparent', true);
      assert.calledWith(fakeStore.setExpanded, 'anotherparent', true);
      assert.calledWith(fakeStore.setExpanded, 'yetanotherancestor', true);
    });

    it('throws an error if there is no focused group', () => {
      fakeStore.focusedGroupId.returns(null);

      assert.throws(() => {
        svc.create(fixtures.newAnnotation(), now);
      }, 'Cannot create annotation without a group');
    });
  });

  describe('createPageNote', () => {
    it('should open the login-prompt panel if the user is not logged in', () => {
      fakeStore.isLoggedIn.returns(false);

      svc.createPageNote();

      assert.calledWith(fakeStore.openSidebarPanel, 'loginPrompt');
      assert.isNull(getLastAddedAnnotation());
    });

    it('should do nothing if there is no main frame URI', () => {
      fakeStore.mainFrame.returns(undefined);

      svc.createPageNote();

      assert.notCalled(fakeStore.openSidebarPanel);
      assert.isNull(getLastAddedAnnotation());
    });

    it('should create a new unsaved annotation with page note defaults', () => {
      svc.createPageNote();

      const annotation = getLastAddedAnnotation();

      assert.equal(annotation.uri, 'http://www.example.com');
      assert.deepEqual(annotation.target, []);
    });
  });

  describe('delete', () => {
    it('removes the annotation via the API', async () => {
      const annot = fixtures.defaultAnnotation();
      await svc.delete(annot);
      assert.calledWith(fakeApi.annotation.delete, { id: annot.id });
    });

    it('removes the annotation from the store', async () => {
      const annot = fixtures.defaultAnnotation();
      await svc.delete(annot);
      assert.calledWith(fakeStore.removeAnnotations, [annot]);
    });

    it('does not remove the annotation from the store if the API call fails', async () => {
      fakeApi.annotation.delete.rejects(new Error('Annotation does not exist'));
      const annot = fixtures.defaultAnnotation();

      await assert.rejects(svc.delete(annot), 'Annotation does not exist');
      assert.notCalled(fakeStore.removeAnnotations);
    });
  });

  describe('flag', () => {
    it('flags the annotation via the API', async () => {
      const annot = fixtures.defaultAnnotation();
      await svc.flag(annot);
      assert.calledWith(fakeApi.annotation.flag, { id: annot.id });
    });

    it('updates the flag status in the store', async () => {
      const annot = fixtures.defaultAnnotation();
      await svc.flag(annot);
      assert.calledWith(fakeStore.updateFlagStatus, annot.id, true);
    });

    it('does not update the flag status if the API call fails', async () => {
      fakeApi.annotation.flag.rejects(new Error('Annotation does not exist'));
      const annot = fixtures.defaultAnnotation();

      await assert.rejects(svc.flag(annot), 'Annotation does not exist');
      assert.notCalled(fakeStore.updateFlagStatus);
    });
  });

  describe('reply', () => {
    const filledAnnotation = () => {
      const annot = fixtures.defaultAnnotation();
      annot.group = 'mix3boop';
      annot.references = ['feedbeef'];

      return annot;
    };

    it('creates a new annotation in the store', () => {
      const annotation = fixtures.defaultAnnotation();

      svc.reply(annotation, 'acct:foo@bar.com');

      assert.calledOnce(fakeStore.addAnnotations);
    });

    it('associates the reply with the annotation', () => {
      const annotation = filledAnnotation();

      svc.reply(annotation, 'acct:foo@bar.com');

      const reply = fakeStore.addAnnotations.getCall(0).args[0][0];

      assert.equal(
        reply.references[reply.references.length - 1],
        annotation.id
      );
      assert.equal(reply.group, annotation.group);
      assert.equal(reply.target[0].source, annotation.target[0].source);
      assert.equal(reply.uri, annotation.uri);
    });

    it('uses public permissions if annotation is public', () => {
      fakeMetadata.isPublic.returns(true);
      fakeSharedPermissions.returns('public');

      const annotation = filledAnnotation();

      svc.reply(annotation, 'acct:foo@bar.com');

      const reply = fakeStore.addAnnotations.getCall(0).args[0][0];
      assert.equal(reply.permissions, 'public');
    });

    it('uses private permissions if annotation is private', () => {
      fakeMetadata.isPublic.returns(false);
      fakePrivatePermissions.returns('private');

      const annotation = filledAnnotation();

      svc.reply(annotation, 'acct:foo@bar.com');

      const reply = fakeStore.addAnnotations.getCall(0).args[0][0];
      assert.equal(reply.permissions, 'private');
    });
  });

  describe('save', () => {
    it('calls the `create` API service for new annotations', () => {
      fakeMetadata.isNew.returns(true);
      // Using the new-annotation fixture has no bearing on which API method
      // will get called because `isNew` is mocked, but it has representative
      // properties
      const annotation = fixtures.newAnnotation();
      return svc.save(annotation).then(() => {
        assert.calledOnce(fakeApi.annotation.create);
        assert.notCalled(fakeApi.annotation.update);
        assert.calledOnce(fakeStore.annotationSaveStarted);
        assert.calledOnce(fakeStore.annotationSaveFinished);
      });
    });

    it('calls the `update` API service for pre-existing annotations', () => {
      fakeMetadata.isNew.returns(false);

      const annotation = fixtures.defaultAnnotation();
      return svc.save(annotation).then(() => {
        assert.calledOnce(fakeApi.annotation.update);
        assert.notCalled(fakeApi.annotation.create);
        assert.calledOnce(fakeStore.annotationSaveStarted);
        assert.calledOnce(fakeStore.annotationSaveFinished);
      });
    });

    it('calls the relevant API service with an object that has any draft changes integrated', () => {
      fakeMetadata.isNew.returns(true);
      fakePrivatePermissions.returns({ read: ['foo'] });
      const annotation = fixtures.defaultAnnotation();
      annotation.text = 'not this';
      annotation.tags = ['nope'];

      fakeStore.getDraft.returns({
        tags: ['one', 'two'],
        text: 'my text',
        isPrivate: true,
        annotation: fixtures.defaultAnnotation(),
      });

      return svc.save(fixtures.defaultAnnotation()).then(() => {
        const annotationWithChanges =
          fakeApi.annotation.create.getCall(0).args[1];
        assert.equal(annotationWithChanges.text, 'my text');
        assert.sameMembers(annotationWithChanges.tags, ['one', 'two']);
        // Permissions converted to "private"
        assert.include(annotationWithChanges.permissions.read, 'foo');
        assert.notInclude(annotationWithChanges.permissions.read, [
          'group:__world__',
        ]);
      });
    });

    context('successful save', () => {
      it('copies over internal app-specific keys to the annotation object', () => {
        fakeMetadata.isNew.returns(false);
        const annotation = fixtures.defaultAnnotation();
        annotation.$tag = 'mytag';
        annotation.$foo = 'bar';

        // The fixture here has no `$`-prefixed props
        fakeApi.annotation.update.resolves(fixtures.defaultAnnotation());

        return svc.save(annotation).then(() => {
          const savedAnnotation =
            fakeStore.addAnnotations.getCall(0).args[0][0];
          assert.equal(savedAnnotation.$tag, 'mytag');
          assert.equal(savedAnnotation.$foo, 'bar');
        });
      });

      it('removes the annotation draft', () => {
        const annotation = fixtures.defaultAnnotation();

        return svc.save(annotation).then(() => {
          assert.calledWith(fakeStore.removeDraft, annotation);
        });
      });

      it('adds the updated annotation to the store', () => {
        const annotation = fixtures.defaultAnnotation();
        fakeMetadata.isNew.returns(false);
        fakeApi.annotation.update.resolves(annotation);

        return svc.save(annotation).then(() => {
          assert.calledWith(fakeStore.addAnnotations, [annotation]);
        });
      });
    });

    context('error on save', () => {
      it('removes the active save request from the store', () => {
        fakeApi.annotation.update.rejects();
        fakeMetadata.isNew.returns(false);

        return svc.save(fixtures.defaultAnnotation()).catch(() => {
          assert.notCalled(fakeStore.removeDraft);
          assert.calledOnce(fakeStore.annotationSaveFinished);
        });
      });

      it('does not remove the annotation draft', () => {
        fakeApi.annotation.update.rejects();
        fakeMetadata.isNew.returns(false);

        return svc.save(fixtures.defaultAnnotation()).catch(() => {
          assert.notCalled(fakeStore.removeDraft);
        });
      });

      it('does not add the annotation to the store', () => {
        fakeApi.annotation.update.rejects();
        fakeMetadata.isNew.returns(false);

        return svc.save(fixtures.defaultAnnotation()).catch(() => {
          assert.notCalled(fakeStore.addAnnotations);
        });
      });
    });
  });
});
