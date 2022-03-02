import fakeReduxStore from '../../test/fake-redux-store';
import { GroupsService, $imports } from '../groups';
import { waitFor } from '../../../test-util/wait';

/**
 * Generate a truth table containing every possible combination of a set of
 * boolean inputs.
 *
 * @param {number} columns
 * @return {Array<boolean[]>}
 */
function truthTable(columns) {
  if (columns === 1) {
    return [[true], [false]];
  }
  const subTable = truthTable(columns - 1);
  return [
    ...subTable.map(row => [true, ...row]),
    ...subTable.map(row => [false, ...row]),
  ];
}

// Return a mock session service containing three groups.
const sessionWithThreeGroups = function () {
  return {
    state: {},
  };
};

const dummyGroups = [
  {
    name: 'Group 1',
    id: 'id1',
    scopes: { enforced: false, uri_patterns: ['http://foo.com'] },
  },
  { name: 'Group 2', id: 'id2' },
  { name: 'Group 3', id: 'id3' },
];

describe('GroupsService', () => {
  let fakeAuth;
  let fakeStore;
  let fakeSession;
  let fakeSettings;
  let fakeApi;
  let fakeMetadata;
  let fakeToastMessenger;

  beforeEach(() => {
    fakeAuth = {
      getAccessToken: sinon.stub().returns('1234'),
    };

    fakeMetadata = {
      isReply: sinon.stub(),
    };

    fakeToastMessenger = {
      error: sinon.stub(),
    };

    fakeStore = fakeReduxStore(
      {
        frames: [{ uri: 'http://example.org' }],
        groups: {
          focusedGroup: null,
          groups: [],
        },
        directLinked: {
          directLinkedGroupId: null,
          directLinkedAnnotationId: null,
        },
      },
      {
        addAnnotations: sinon.stub(),
        directLinkedAnnotationId: sinon.stub().returns(null),
        directLinkedGroupId: sinon.stub().returns(null),
        focusGroup: sinon.stub(),
        focusedGroupId: sinon.stub(),
        getDefault: sinon.stub(),
        getGroup: sinon.stub(),
        hasFetchedProfile: sinon.stub().returns(false),
        loadGroups: sinon.stub(),
        newAnnotations: sinon.stub().returns([]),
        allGroups() {
          return this.getState().groups.groups;
        },
        focusedGroup() {
          return this.getState().groups.focusedGroup;
        },
        mainFrame() {
          return this.getState().frames[0];
        },
        setDefault: sinon.stub(),
        setDirectLinkedGroupFetchFailed: sinon.stub(),
        clearDirectLinkedGroupFetchFailed: sinon.stub(),
        profile: sinon.stub().returns({ userid: null }),
        route: sinon.stub().returns('sidebar'),
      }
    );
    fakeSession = sessionWithThreeGroups();
    fakeApi = {
      annotation: {
        get: sinon.stub(),
      },

      group: {
        member: {
          delete: sinon.stub().returns(Promise.resolve()),
        },
        read: sinon.stub().returns(Promise.resolve(new Error('404 Error'))),
      },
      groups: {
        list: sinon.stub().returns(dummyGroups),
      },
      profile: {
        groups: {
          read: sinon.stub().returns(Promise.resolve([dummyGroups[0]])),
        },
      },
    };
    fakeSettings = { group: null };

    $imports.$mock({
      '../helpers/annotation-metadata': fakeMetadata,
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  function createService() {
    return new GroupsService(
      fakeStore,
      fakeApi,
      fakeAuth,
      fakeSession,
      fakeSettings,
      fakeToastMessenger
    );
  }

  describe('#focus', () => {
    it('updates the focused group in the store', () => {
      const svc = createService();
      fakeStore.focusedGroupId.returns('whatever');

      svc.focus('whatnot');

      assert.calledOnce(fakeStore.focusGroup);
      assert.calledWith(fakeStore.focusGroup, 'whatnot');
    });

    context('focusing to a different group than before', () => {
      beforeEach(() => {
        fakeStore.focusedGroupId.returns('newgroup');
        fakeStore.focusedGroupId.onFirstCall().returns('whatnot');
      });

      it('moves top-level annotations to the newly-focused group', () => {
        const fakeAnnotations = [
          { $tag: '1', group: 'groupA' },
          { $tag: '2', group: 'groupB' },
        ];
        fakeMetadata.isReply.returns(false);
        fakeStore.newAnnotations.returns(fakeAnnotations);

        const svc = createService();
        svc.focus('newgroup');

        assert.calledWith(
          fakeStore.addAnnotations,
          sinon.match([
            { $tag: '1', group: 'newgroup' },
            { $tag: '2', group: 'newgroup' },
          ])
        );

        const updatedAnnotations = fakeStore.addAnnotations.getCall(0).args[0];
        updatedAnnotations.forEach(annot => {
          assert.equal(annot.group, 'newgroup');
        });
      });

      it('does not move replies to the newly-focused group', () => {
        fakeMetadata.isReply.returns(true);
        fakeStore.newAnnotations.returns([
          { $tag: '1', group: 'groupA' },
          { $tag: '2', group: 'groupB' },
        ]);

        const svc = createService();
        svc.focus('newgroup');

        assert.calledTwice(fakeMetadata.isReply);
        assert.notCalled(fakeStore.addAnnotations);
      });

      it('updates the focused-group default', () => {
        const svc = createService();
        svc.focus('newgroup');

        assert.calledOnce(fakeStore.setDefault);
        assert.calledWith(fakeStore.setDefault, 'focusedGroup', 'newgroup');
      });
    });

    it('does not update the focused-group default if the group has not changed', () => {
      fakeStore.focusedGroupId.returns('samegroup');

      const svc = createService();
      svc.focus('samegroup');

      assert.notCalled(fakeStore.setDefault);
    });
  });

  describe('#load', () => {
    it('filters out direct-linked groups that are out of scope and scope enforced', () => {
      const svc = createService();
      fakeStore.getDefault.returns(dummyGroups[0].id);
      const outOfScopeEnforcedGroup = {
        id: 'oos',
        scopes: { enforced: true, uri_patterns: ['http://foo.com'] },
      };
      fakeStore.directLinkedGroupId.returns(outOfScopeEnforcedGroup.id);

      fakeApi.group.read.returns(Promise.resolve(outOfScopeEnforcedGroup));
      return svc.load().then(groups => {
        // The failure state is captured in the store.
        assert.called(fakeStore.setDirectLinkedGroupFetchFailed);
        // The focus group is not set to the direct-linked group.
        assert.calledWith(fakeStore.focusGroup, dummyGroups[0].id);
        // The direct-linked group is not in the list of groups.
        assert.isFalse(groups.some(g => g.id === outOfScopeEnforcedGroup.id));
      });
    });

    it('catches error from api.group.read request', () => {
      const svc = createService();
      fakeStore.getDefault.returns(dummyGroups[0].id);
      fakeStore.directLinkedGroupId.returns('does-not-exist');

      fakeApi.group.read.returns(
        Promise.reject(
          new Error(
            "404 Not Found: Either the resource you requested doesn't exist, \
          or you are not currently authorized to see it."
          )
        )
      );
      return svc.load().then(() => {
        // The failure state is captured in the store.
        assert.called(fakeStore.setDirectLinkedGroupFetchFailed);
        // The focus group is not set to the direct-linked group.
        assert.calledWith(fakeStore.focusGroup, dummyGroups[0].id);
      });
    });

    it('combines groups from both endpoints', () => {
      const svc = createService();

      const groups = [
        { id: 'groupa', name: 'GroupA' },
        { id: 'groupb', name: 'GroupB' },
      ];

      fakeApi.profile.groups.read.returns(Promise.resolve(groups));
      fakeApi.groups.list.returns(Promise.resolve([groups[0]]));

      return svc.load().then(() => {
        assert.calledWith(fakeStore.loadGroups, groups);
      });
    });

    // TODO: Add a de-dup test for the direct-linked annotation.

    it('does not duplicate groups if the direct-linked group is also a featured group', () => {
      const svc = createService();

      fakeStore.directLinkedGroupId.returns(dummyGroups[0].id);
      fakeApi.group.read.returns(Promise.resolve(dummyGroups[0]));

      // Include the dummyGroups[0] in the featured groups.
      fakeApi.profile.groups.read.returns(Promise.resolve([]));
      fakeApi.groups.list.returns(Promise.resolve([dummyGroups[0]]));

      return svc.load().then(groups => {
        const groupIds = groups.map(g => g.id);
        assert.deepEqual(groupIds, [dummyGroups[0].id]);
      });
    });

    it('combines groups from all 3 endpoints if there is a selectedGroup', () => {
      const svc = createService();

      fakeStore.directLinkedGroupId.returns('selected-id');

      const groups = [
        { id: 'groupa', name: 'GroupA' },
        { id: 'groupb', name: 'GroupB' },
        { id: 'selected-id', name: 'Selected Group' },
      ];

      fakeApi.profile.groups.read.returns(Promise.resolve([groups[0]]));
      fakeApi.groups.list.returns(Promise.resolve([groups[1]]));
      fakeApi.group.read.returns(Promise.resolve(groups[2]));

      return svc.load().then(() => {
        assert.calledWith(fakeStore.loadGroups, groups);
      });
    });

    it('passes the direct-linked group id from the store to the api.group.read call', () => {
      const svc = createService();

      fakeStore.directLinkedGroupId.returns('selected-id');

      const group = { id: 'selected-id', name: 'Selected Group' };

      fakeApi.profile.groups.read.returns(Promise.resolve([]));
      fakeApi.groups.list.returns(Promise.resolve([]));
      fakeApi.group.read.returns(Promise.resolve(group));

      return svc.load().then(() => {
        assert.calledWith(
          fakeApi.group.read,
          sinon.match({
            id: 'selected-id',
          })
        );
      });
    });

    it('loads all available groups', () => {
      const svc = createService();

      return svc.load().then(() => {
        assert.calledWith(fakeStore.loadGroups, dummyGroups);
      });
    });

    it('sends `expand` parameter', () => {
      const svc = createService();
      fakeApi.groups.list.returns(
        Promise.resolve([{ id: 'groupa', name: 'GroupA' }])
      );
      fakeStore.directLinkedGroupId.returns('group-id');

      return svc.load().then(() => {
        assert.calledWith(
          fakeApi.profile.groups.read,
          sinon.match({ expand: ['organization', 'scopes'] })
        );
        assert.calledWith(
          fakeApi.groups.list,
          sinon.match({ expand: ['organization', 'scopes'] })
        );
        assert.calledWith(
          fakeApi.group.read,
          sinon.match({ expand: ['organization', 'scopes'] })
        );
      });
    });

    it('sets the focused group from the value saved in local storage', () => {
      const svc = createService();
      fakeStore.getDefault.returns(dummyGroups[1].id);
      return svc.load().then(() => {
        assert.calledWith(fakeStore.focusGroup, dummyGroups[1].id);
      });
    });

    it("sets the direct-linked annotation's group to take precedence over the group saved in local storage and the direct-linked group", () => {
      const svc = createService();
      fakeStore.directLinkedAnnotationId.returns('ann-id');
      fakeStore.directLinkedGroupId.returns(dummyGroups[1].id);

      fakeStore.getDefault.returns(dummyGroups[0].id);
      fakeApi.groups.list.returns(Promise.resolve(dummyGroups));
      fakeApi.annotation.get.returns(
        Promise.resolve({
          id: 'ann-id',
          group: dummyGroups[2].id,
        })
      );
      return svc.load().then(() => {
        assert.calledWith(fakeStore.focusGroup, dummyGroups[2].id);
      });
    });

    it("sets the focused group to the direct-linked annotation's group", () => {
      const svc = createService();
      fakeStore.directLinkedAnnotationId.returns('ann-id');

      fakeApi.groups.list.returns(Promise.resolve(dummyGroups));
      fakeStore.getDefault.returns(dummyGroups[0].id);
      fakeApi.annotation.get.returns(
        Promise.resolve({
          id: 'ann-id',
          group: dummyGroups[1].id,
        })
      );
      return svc.load().then(() => {
        assert.calledWith(fakeStore.focusGroup, dummyGroups[1].id);
      });
    });

    it('sets the direct-linked group to take precedence over the group saved in local storage', () => {
      const svc = createService();

      fakeStore.directLinkedGroupId.returns(dummyGroups[1].id);
      fakeStore.getDefault.returns(dummyGroups[0].id);
      fakeApi.groups.list.returns(Promise.resolve(dummyGroups));
      return svc.load().then(() => {
        assert.calledWith(fakeStore.focusGroup, dummyGroups[1].id);
      });
    });

    it('sets the focused group to the direct-linked group', () => {
      const svc = createService();

      fakeStore.directLinkedGroupId.returns(dummyGroups[1].id);
      fakeApi.groups.list.returns(Promise.resolve(dummyGroups));
      return svc.load().then(() => {
        assert.calledWith(fakeStore.focusGroup, dummyGroups[1].id);
      });
    });

    it('clears the directLinkedGroupFetchFailed state if loading a direct-linked group', () => {
      const svc = createService();
      fakeStore.directLinkedGroupId.returns(dummyGroups[1].id);
      fakeApi.groups.list.returns(Promise.resolve(dummyGroups));

      return svc.load().then(() => {
        assert.called(fakeStore.clearDirectLinkedGroupFetchFailed);
        assert.notCalled(fakeStore.setDirectLinkedGroupFetchFailed);
      });
    });

    [null, 'some-group-id'].forEach(groupId => {
      it('does not set the focused group if not present in the groups list', () => {
        const svc = createService();
        fakeStore.getDefault.returns(groupId);
        return svc.load().then(() => {
          assert.notCalled(fakeStore.focusGroup);
        });
      });
    });

    context('in the sidebar', () => {
      it('waits for the document URL to be determined', () => {
        const svc = createService();

        fakeStore.setState({ frames: [null] });
        const loaded = svc.load();
        fakeStore.setState({ frames: [{ uri: 'https://asite.com' }] });

        return loaded.then(() => {
          assert.calledWith(fakeApi.groups.list, {
            document_uri: 'https://asite.com',
            expand: ['organization', 'scopes'],
          });
        });
      });
    });

    context('in the stream and single annotation page', () => {
      beforeEach(() => {
        fakeStore.route.returns('stream');
      });

      it('does not wait for the document URL', () => {
        fakeStore.setState({ frames: [null] });
        const svc = createService();
        return svc.load().then(() => {
          assert.calledWith(fakeApi.groups.list, {
            expand: ['organization', 'scopes'],
          });
        });
      });
    });

    it('passes authority argument when using a third-party authority', () => {
      fakeSettings.services = [{ authority: 'publisher.org' }];
      const svc = createService();
      return svc.load().then(() => {
        assert.calledWith(
          fakeApi.groups.list,
          sinon.match({ authority: 'publisher.org' })
        );
      });
    });

    it('injects a default organization if group is missing an organization', () => {
      const svc = createService();
      const groups = [{ id: '39r39f', name: 'Ding Dong!' }];
      fakeApi.groups.list.returns(Promise.resolve(groups));
      return svc.load().then(groups => {
        assert.isObject(groups[0].organization);
        assert.hasAllKeys(groups[0].organization, ['id', 'name', 'logo']);
      });
    });

    it('catches error when fetching the direct-linked annotation', () => {
      const svc = createService();

      fakeStore.directLinkedAnnotationId.returns('ann-id');
      fakeApi.profile.groups.read.returns(Promise.resolve([]));
      fakeApi.groups.list.returns(
        Promise.resolve([{ name: 'BioPub', id: 'biopub' }])
      );
      fakeApi.annotation.get.returns(
        Promise.reject(
          new Error(
            "404 Not Found: Either the resource you requested doesn't exist, \
          or you are not currently authorized to see it."
          )
        )
      );

      return svc.load().then(groups => {
        const groupIds = groups.map(g => g.id);
        assert.deepEqual(groupIds, ['biopub']);
      });
    });

    it("catches error when fetching the direct-linked annotation's group", () => {
      const svc = createService();

      fakeStore.directLinkedAnnotationId.returns('ann-id');

      fakeApi.profile.groups.read.returns(Promise.resolve([]));
      fakeApi.groups.list.returns(
        Promise.resolve([
          { name: 'BioPub', id: 'biopub' },
          { name: 'Public', id: '__world__' },
        ])
      );
      fakeApi.group.read.returns(
        Promise.reject(
          new Error(
            "404 Not Found: Either the resource you requested doesn't exist, \
          or you are not currently authorized to see it."
          )
        )
      );
      fakeApi.annotation.get.returns(
        Promise.resolve({
          id: 'ann-id',
          group: 'out-of-scope',
        })
      );

      // The user is logged out.
      fakeAuth.getAccessToken.returns(null);

      return svc.load().then(groups => {
        const groupIds = groups.map(g => g.id);
        assert.deepEqual(groupIds, ['biopub']);
      });
    });

    it("includes the direct-linked annotation's group when it is not in the normal list of groups", () => {
      const svc = createService();

      fakeStore.directLinkedAnnotationId.returns('ann-id');

      fakeApi.profile.groups.read.returns(Promise.resolve([]));
      fakeApi.groups.list.returns(
        Promise.resolve([
          { name: 'BioPub', id: 'biopub' },
          { name: 'Public', id: '__world__' },
        ])
      );
      fakeApi.group.read.returns(
        Promise.resolve({ name: 'Restricted', id: 'out-of-scope' })
      );
      fakeApi.annotation.get.returns(
        Promise.resolve({
          id: 'ann-id',
          group: 'out-of-scope',
        })
      );

      return svc.load().then(groups => {
        const directLinkedAnnGroupShown = groups.some(
          g => g.id === 'out-of-scope'
        );
        assert.isTrue(directLinkedAnnGroupShown);
      });
    });

    it('both groups are in the final groups list when an annotation and a group are linked to', () => {
      // This can happen if the linked to annotation and group are configured by
      // the frame embedding the client.
      const svc = createService();

      fakeStore.directLinkedGroupId.returns('out-of-scope');
      fakeStore.directLinkedAnnotationId.returns('ann-id');

      fakeApi.profile.groups.read.returns(Promise.resolve([]));
      fakeApi.groups.list.returns(
        Promise.resolve([
          { name: 'BioPub', id: 'biopub' },
          { name: 'Public', id: '__world__' },
        ])
      );
      fakeApi.group.read.returns(
        Promise.resolve({ name: 'Restricted', id: 'out-of-scope' })
      );
      fakeApi.annotation.get.returns(
        Promise.resolve({
          id: 'ann-id',
          group: '__world__',
        })
      );

      // The user is logged out.
      fakeAuth.getAccessToken.returns(null);

      return svc.load().then(groups => {
        const linkedToGroupShown = groups.some(g => g.id === 'out-of-scope');
        assert.isTrue(linkedToGroupShown);
        const linkedToAnnGroupShown = groups.some(g => g.id === '__world__');
        assert.isTrue(linkedToAnnGroupShown);
      });
    });

    it('includes the "Public" group if the user links to it', () => {
      // Set up the test under conditions that would otherwise
      // not return the Public group. Aka: the user is logged
      // out and there are associated groups.
      const svc = createService();

      fakeStore.directLinkedGroupId.returns('__world__');

      fakeApi.profile.groups.read.returns(Promise.resolve([]));
      fakeApi.groups.list.returns(
        Promise.resolve([
          { name: 'BioPub', id: 'biopub' },
          { name: 'Public', id: '__world__' },
        ])
      );
      fakeApi.group.read.returns(
        Promise.resolve({ name: 'Public', id: '__world__' })
      );

      fakeAuth.getAccessToken.returns(null);

      return svc.load().then(groups => {
        const publicGroupShown = groups.some(g => g.id === '__world__');
        assert.isTrue(publicGroupShown);
      });
    });

    truthTable(3).forEach(
      ([loggedIn, pageHasAssociatedGroups, directLinkToPublicAnnotation]) => {
        it('excludes the "Public" group if user logged out and page has associated groups', () => {
          const svc = createService();
          const shouldShowPublicGroup =
            loggedIn ||
            !pageHasAssociatedGroups ||
            directLinkToPublicAnnotation;

          // Setup the direct-linked annotation.
          if (directLinkToPublicAnnotation) {
            fakeApi.annotation.get.returns(
              Promise.resolve({
                id: 'direct-linked-ann',
                group: '__world__',
              })
            );
            fakeStore.directLinkedAnnotationId.returns('direct-linked-ann');
          }

          // Create groups response from server.
          const groups = [{ name: 'Public', id: '__world__' }];
          if (pageHasAssociatedGroups) {
            groups.push({ name: 'BioPub', id: 'biopub' });
          }

          fakeAuth.getAccessToken.returns(loggedIn ? '1234' : null);
          fakeApi.groups.list.returns(Promise.resolve(groups));

          return svc.load().then(groups => {
            const publicGroupShown = groups.some(g => g.id === '__world__');
            assert.equal(publicGroupShown, shouldShowPublicGroup);
          });
        });
      }
    );

    context('when service config specifies which groups to show', () => {
      const makeGroup = (id, groupid = null) => ({ id, groupid });
      const setServiceConfigGroups = groupids => {
        fakeSettings.services = [{ groups: groupids }];
      };

      const groupA = makeGroup('id-a');
      const groupB = makeGroup('id-b', 'groupid-b');
      const groupC = makeGroup('id-c');

      beforeEach(() => {
        fakeApi.profile.groups.read.resolves([]);
        fakeApi.group.read.rejects(new Error('Not Found'));
      });

      it('loads groups specified by id or groupid in service config', async () => {
        setServiceConfigGroups(['id-a', 'groupid-b']);
        fakeApi.profile.groups.read.resolves([groupA, groupB, groupC]);

        const svc = createService();
        const groups = await svc.load();

        assert.deepEqual(
          groups.map(g => g.id),
          ['id-a', 'id-b']
        );
      });

      it('loads groups specified asynchronously in service config', async () => {
        setServiceConfigGroups(Promise.resolve(['id-a', 'groupid-b']));
        fakeApi.profile.groups.read.resolves([groupA, groupB, groupC]);

        const svc = createService();
        const groups = await svc.load();

        assert.deepEqual(
          groups.map(g => g.id),
          ['id-a', 'id-b']
        );
      });

      it(`fetches groups by ID if the group is not in the user's groups`, async () => {
        setServiceConfigGroups(Promise.resolve(['id-a', 'groupid-b', 'id-c']));
        const serverGroups = [groupA, groupB, groupC];
        fakeApi.profile.groups.read.resolves([groupA]);
        fakeApi.group.read.callsFake(async ({ id }) => {
          const group = serverGroups.find(g => g.id === id || g.groupid === id);
          if (!group) {
            throw new Error(`Group ${id} not found`);
          }
          return group;
        });

        const svc = createService();
        const groups = await svc.load();

        const expand = ['organization', 'scopes'];
        assert.calledWith(fakeApi.group.read, { expand, id: 'groupid-b' });
        assert.calledWith(fakeApi.group.read, { expand, id: 'id-c' });
        assert.deepEqual(
          groups.map(g => g.id),
          ['id-a', 'id-b', 'id-c']
        );
      });

      it(`does not fetch group by ID if the group is in the user's groups`, async () => {
        setServiceConfigGroups(Promise.resolve(['id-a', 'groupid-b']));
        fakeApi.profile.groups.read.resolves([groupA, groupB, groupC]);

        const svc = createService();
        await svc.load();

        assert.notCalled(fakeApi.group.read);
      });

      it('reports an error if a group specified in service config fails to load', async () => {
        setServiceConfigGroups(Promise.resolve(['id-a', 'missing']));
        fakeApi.profile.groups.read.resolves([groupA]);
        fakeApi.group.read.rejects(new Error('Not Found'));

        const svc = createService();
        const groups = await svc.load();

        assert.calledWith(
          fakeToastMessenger.error,
          'Unable to fetch groups: Not Found'
        );

        // The groups that were found should still be loaded.
        assert.deepEqual(
          groups.map(g => g.id),
          ['id-a']
        );
      });

      it('reports an error if fetching group IDs from service config fails', async () => {
        setServiceConfigGroups(
          Promise.reject(new Error('Something went wrong'))
        );

        const svc = createService();
        const groups = await svc.load();

        assert.calledWith(
          fakeToastMessenger.error,
          'Unable to fetch group configuration: Something went wrong'
        );
        assert.deepEqual(groups, []);
      });

      it('initially sets the focused group to the `directLinkedGroupId`', async () => {
        setServiceConfigGroups(Promise.resolve(['id-a', 'id-b', 'id-c']));
        fakeApi.profile.groups.read.resolves([groupA, groupB, groupC]);
        fakeStore.directLinkedGroupId.returns('id-c');

        const svc = createService();
        await svc.load();

        assert.calledWith(fakeStore.focusGroup, 'id-c');
      });

      it('does not set the focused group if no `directLinkedGroupId`', async () => {
        setServiceConfigGroups(Promise.resolve(['id-a', 'id-b', 'id-c']));
        fakeApi.profile.groups.read.resolves([groupA, groupB, groupC]);
        fakeStore.directLinkedGroupId.returns(null);

        const svc = createService();
        await svc.load();

        assert.notCalled(fakeStore.focusGroup);
      });
    });
  });

  describe('#leave', () => {
    it('should call the group leave API', () => {
      const s = createService();
      return s.leave('id2').then(() => {
        assert.calledWithMatch(fakeApi.group.member.delete, {
          pubid: 'id2',
          userid: 'me',
        });
      });
    });
  });

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  describe('automatic re-fetching', () => {
    it('refetches groups when the logged-in user changes', async () => {
      const svc = createService();

      // Load groups before profile fetch has completed.
      fakeStore.hasFetchedProfile.returns(false);
      await svc.load();

      // Simulate initial fetch of profile finishing. This should be ignored.
      fakeApi.groups.list.resetHistory();
      fakeStore.hasFetchedProfile.returns(true);
      fakeStore.profile.returns({ userid: 'acct:firstuser@hypothes.is' });
      fakeStore.setState({}); // Notify store subscribers.

      // Wait briefly, as there are a few async steps before the group fetch
      // from the API starts, if it is going to happen.
      await delay(1);
      assert.notCalled(fakeApi.groups.list);

      // Simulate user logging out (or logging in). This should trigger a re-fetching
      // of groups.
      fakeStore.hasFetchedProfile.returns(true);
      fakeStore.profile.returns({ userid: 'acct:otheruser@hypothes.is' });
      fakeStore.setState({});

      await waitFor(() => fakeApi.groups.list.callCount > 0);
      assert.calledOnce(fakeApi.groups.list);
    });

    context('when a new frame connects', () => {
      it('should refetch groups if main frame URL has changed', async () => {
        const svc = createService();

        fakeStore.setState({
          frames: [{ uri: 'https://domain.com/page-a' }],
        });
        await svc.load();

        // Simulate main frame URL change, eg. due to client-side navigation in
        // a single page application.
        fakeApi.groups.list.resetHistory();
        fakeStore.setState({
          frames: [{ uri: 'https://domain.com/page-b' }],
        });

        await waitFor(() => fakeApi.groups.list.callCount > 0);
        assert.calledOnce(fakeApi.groups.list);
      });

      it('should not refetch groups if main frame URL has not changed', async () => {
        const svc = createService();

        fakeStore.setState({
          frames: [{ uri: 'https://domain.com/page-a' }],
        });

        await svc.load();
        assert.calledOnce(fakeApi.groups.list);

        // A new frame connects, but the main frame URI remains the same.
        fakeApi.groups.list.resetHistory();
        fakeStore.setState({
          frames: [
            { uri: 'https://domain.com/page-a' },
            { uri: 'https://domain.com/iframe-b' },
          ],
        });

        // Wait briefly, as there are a few async steps before the group fetch
        // from the API starts, if it is going to happen.
        await delay(1);
        assert.notCalled(fakeApi.groups.list);
      });
    });
  });
});
