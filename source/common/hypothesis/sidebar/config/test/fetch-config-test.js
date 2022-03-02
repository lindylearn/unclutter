import { fetchConfig, $imports } from '../fetch-config';

describe('sidebar/config/fetch-config', () => {
  let fakeHostConfig;
  let fakeJsonRpc;
  let fakeWindow;
  let fakeApiUrl;
  let fakeTopWindow;

  beforeEach(() => {
    fakeHostConfig = sinon.stub();
    fakeJsonRpc = {
      call: sinon.stub(),
    };
    fakeApiUrl = sinon.stub().returns('https://dev.hypothes.is/api/');
    $imports.$mock({
      './host-config': fakeHostConfig,
      '../util/postmessage-json-rpc': fakeJsonRpc,
      './get-api-url': fakeApiUrl,
    });

    // By default, embedder provides no custom config.
    fakeHostConfig.returns({});

    // By default, fetching config from parent frames fails.
    fakeJsonRpc.call.throws(new Error('call() response not set'));

    // Setup fake window hierarchy.
    fakeTopWindow = { parent: null, top: null, testId: 2 };
    fakeTopWindow.parent = fakeTopWindow; // Yep, the DOM really works like this.
    fakeTopWindow.top = fakeTopWindow;

    const fakeParent = { parent: fakeTopWindow, top: fakeTopWindow, testId: 1 };

    fakeWindow = { parent: fakeParent, top: fakeTopWindow, testId: 0 };
  });

  afterEach(() => {
    $imports.$restore();
  });

  describe('config/fetch-config', () => {
    context('direct embed', () => {
      // no `requestConfigFromFrame` variable
      //
      // Combine the settings rendered into the sidebar's HTML page
      // by h with the settings from `window.hypothesisConfig` in the parent
      // window.
      it('adds the apiUrl to the merged result', async () => {
        const mergedConfig = await fetchConfig({});
        assert.deepEqual(mergedConfig, { apiUrl: fakeApiUrl() });
      });

      it('does not fetch settings from ancestor frames', async () => {
        await fetchConfig({});
        assert.notCalled(fakeJsonRpc.call);
      });

      it('merges the hostPageConfig onto appConfig and returns the result', async () => {
        // hostPageConfig shall take precedent over appConfig
        const appConfig = { foo: 'bar', appType: 'via' };
        fakeHostConfig.returns({ foo: 'baz' });
        const mergedConfig = await fetchConfig(appConfig);
        assert.deepEqual(mergedConfig, {
          foo: 'baz',
          appType: 'via',
          apiUrl: fakeApiUrl(),
        });
      });
    });

    context('from an RPC parent of unknown ancestry', () => {
      // @deprecated
      // `requestConfigFromFrame` is a string containing an origin
      //
      // In scenarios like LMS integrations, the client is annotating a document
      // inside an iframe and the client needs to retrieve configuration
      // securely from the top-level window without  that configuration being
      // exposed to the document itself.
      const expectedTimeout = 3000;
      beforeEach(() => {
        fakeHostConfig.returns({
          requestConfigFromFrame: 'https://embedder.com',
        });
        sinon.stub(console, 'warn');
      });

      afterEach(() => {
        console.warn.restore();
      });

      it('fetches config from ancestor frames', async () => {
        fakeJsonRpc.call.returns(Promise.resolve({}));
        await fetchConfig({}, fakeWindow);
        // The client will send a message to each ancestor asking for
        // configuration. Only those with the expected origin will be able to
        // respond.
        const ancestors = [fakeWindow.parent, fakeWindow.parent.parent];
        ancestors.forEach(frame => {
          assert.calledWith(
            fakeJsonRpc.call,
            frame,
            'https://embedder.com',
            'requestConfig',
            [],
            expectedTimeout
          );
        });
      });

      it('rejects if sidebar is top frame', async () => {
        fakeWindow.parent = fakeWindow;
        fakeWindow.top = fakeWindow;
        await assert.rejects(
          fetchConfig({}, fakeWindow),
          'Client is top frame'
        );
      });

      it('rejects if fetching config fails', async () => {
        fakeJsonRpc.call.returns(Promise.reject(new Error('Nope')));
        await assert.rejects(fetchConfig({}, fakeWindow), 'Nope');
      });

      it('returns config from ancestor frame', async () => {
        // When the embedder responds with configuration, that should be
        // returned by `fetchConfig`.
        fakeJsonRpc.call.returns(new Promise(() => {}));
        fakeJsonRpc.call
          .withArgs(
            fakeWindow.parent.parent,
            'https://embedder.com',
            'requestConfig',
            [],
            expectedTimeout
          )
          .returns(
            Promise.resolve({
              // Here the embedder's parent returns service configuration
              // (aka. credentials for automatic login).
              services: [
                {
                  apiUrl: 'https://servi.ce/api/',
                  grantToken: 'secret-token',
                },
              ],
            })
          );

        const config = await fetchConfig({}, fakeWindow);
        assert.deepEqual(config, {
          apiUrl: fakeApiUrl(),
          services: [
            {
              apiUrl: 'https://servi.ce/api/',
              grantToken: 'secret-token',
            },
          ],
        });
      });
    });

    context('from an RPC parent of known ancestry', () => {
      // `requestConfigFromFrame` is an object containing an `origin` and `ancestorLevel`
      //
      // In scenarios like LMS integrations, the client is annotating a document
      // inside an iframe and the client needs to retrieve configuration
      // securely from the top-level window without  that configuration being
      // exposed to the document itself.
      beforeEach(() => {
        fakeJsonRpc.call.resolves({});
        fakeHostConfig.returns({
          requestConfigFromFrame: {
            origin: 'https://embedder.com',
            ancestorLevel: 2,
          },
        });
      });

      it('makes an RPC request to `requestConfig` ', async () => {
        await fetchConfig({}, fakeWindow);
        assert.isTrue(
          fakeJsonRpc.call.calledWithExactly(
            fakeTopWindow,
            'https://embedder.com',
            'requestConfig',
            [],
            3000
          )
        );
      });

      [0, 1, 2].forEach(level => {
        it(`finds ${level}'th ancestor window according to how high the level is`, async () => {
          fakeHostConfig.returns({
            requestConfigFromFrame: {
              origin: 'https://embedder.com',
              ancestorLevel: level,
            },
          });
          await fetchConfig({}, fakeWindow);
          // testId is a fake property used to assert the level of the fake window
          assert.equal(fakeJsonRpc.call.getCall(0).args[0].testId, level);
        });
      });

      it('throws an error when target ancestor exceeds top window', async () => {
        fakeHostConfig.returns({
          requestConfigFromFrame: {
            origin: 'https://embedder.com',
            ancestorLevel: 10, // The top window is only 2 levels high
          },
        });
        await assert.rejects(
          fetchConfig({}, fakeWindow),
          /The target parent frame has exceeded the ancestor tree|Try reducing the/g
        );
      });

      it('creates a merged config when the RPC requests returns the host config', async () => {
        const appConfig = { foo: 'bar', appType: 'via' };
        fakeJsonRpc.call.resolves({ foo: 'baz' }); // host config
        const result = await fetchConfig(appConfig, fakeWindow);
        assert.deepEqual(result, {
          foo: 'baz',
          appType: 'via',
          apiUrl: fakeApiUrl(),
        });
      });

      it('rejects if fetching config fails` ', async () => {
        fakeJsonRpc.call.rejects(new Error('Nope'));
        const appConfig = { foo: 'bar', appType: 'via' };
        await assert.rejects(fetchConfig(appConfig, fakeWindow), 'Nope');
      });

      it('returns the `groups` array with the initial host config request', async () => {
        const appConfig = {
          services: [{ groups: ['group1', 'group2'] }],
          appType: 'via',
        };
        fakeJsonRpc.call.onFirstCall().resolves({ foo: 'baz' }); // host config
        const result = await fetchConfig(appConfig, fakeWindow);
        assert.deepEqual(result.services[0].groups, ['group1', 'group2']);
      });

      it("creates a merged config where `groups` is a promise when its initial value is '$rpc:requestGroups'", async () => {
        const appConfig = {
          services: [{ groups: '$rpc:requestGroups' }],
          appType: 'via',
        };
        fakeJsonRpc.call.onFirstCall().resolves({ foo: 'baz' }); // host config
        fakeJsonRpc.call.onSecondCall().resolves(['group1', 'group2']); // requestGroups
        const result = await fetchConfig(appConfig, fakeWindow);
        assert.deepEqual(await result.services[0].groups, ['group1', 'group2']);
        assert.isTrue(
          fakeJsonRpc.call.getCall(1).calledWithExactly(
            fakeTopWindow,
            'https://embedder.com',
            'requestGroups',
            [0], // passes service index to requestGroups
            null // no timeout
          )
        );
      });

      it('throws an error when the RPC call to `requestGroups` fails', async () => {
        const appConfig = {
          services: [{ groups: '$rpc:requestGroups' }],
          appType: 'via',
        };
        fakeJsonRpc.call.onFirstCall().resolves({ foo: 'baz' }); // host config
        fakeJsonRpc.call.onSecondCall().rejects(); // requestGroups
        const result = await fetchConfig(appConfig, fakeWindow);
        await assert.rejects(
          result.services[0].groups,
          'Unable to fetch groups'
        );
      });

      it('creates a merged config and also adds back the `group` value from the host config', async () => {
        fakeHostConfig.returns({
          requestConfigFromFrame: {
            origin: 'https://embedder.com',
            ancestorLevel: 2,
          },
          group: '1234',
        });
        const appConfig = { foo: 'bar', appType: 'via' };
        fakeJsonRpc.call.resolves({ foo: 'baz' });

        const result = await fetchConfig(appConfig, fakeWindow);

        assert.deepEqual(result, {
          foo: 'baz',
          appType: 'via',
          group: '1234',
          apiUrl: fakeApiUrl(),
        });
      });
    });

    context('incorrect requestConfigFromFrame object', () => {
      beforeEach(() => {
        fakeJsonRpc.call.resolves({});
      });

      it('missing ancestorLevel', async () => {
        fakeHostConfig.returns({
          requestConfigFromFrame: {
            origin: 'https://embedder.com',
            // missing ancestorLevel
          },
        });
        await assert.rejects(
          fetchConfig({}, fakeWindow),
          'Improper `requestConfigFromFrame` object. Both `ancestorLevel` and `origin` need to be specified'
        );
      });

      it('missing origin', async () => {
        fakeHostConfig.returns({
          requestConfigFromFrame: {
            // missing origin
            ancestorLevel: 2,
          },
        });
        await assert.rejects(
          fetchConfig({}, fakeWindow),
          'Improper `requestConfigFromFrame` object. Both `ancestorLevel` and `origin` need to be specified'
        );
      });
    });
  });
});
