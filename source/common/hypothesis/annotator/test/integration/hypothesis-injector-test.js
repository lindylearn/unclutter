import { DEBOUNCE_WAIT, onDocumentReady } from '../../frame-observer';
import { HypothesisInjector } from '../../hypothesis-injector';

describe('HypothesisInjector integration test', () => {
  let container;
  let fakeBridge;
  let hypothesisInjectors;

  const sandbox = sinon.createSandbox();
  const config = {
    clientUrl: 'data:,Hypothesis', // empty data uri
  };

  function waitForFrameObserver() {
    return new Promise(resolve => setTimeout(resolve, DEBOUNCE_WAIT + 10));
  }

  function getHypothesisScript(iframe) {
    return iframe.contentDocument.querySelector(
      'script[src="data:,Hypothesis"]'
    );
  }

  function createHypothesisInjector() {
    const injector = new HypothesisInjector(container, fakeBridge, config);
    hypothesisInjectors.push(injector);
    return injector;
  }

  function createAnnotatableIFrame(attribute = 'enable-annotation') {
    const iframe = document.createElement('iframe');
    iframe.setAttribute(attribute, '');
    container.appendChild(iframe);
    return iframe;
  }

  beforeEach(() => {
    fakeBridge = {
      createChannel: sandbox.stub(),
      call: sandbox.stub(),
      destroy: sandbox.stub(),
    };
    hypothesisInjectors = [];

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    sandbox.restore();
    hypothesisInjectors.forEach(injector => injector.destroy());
    container.remove();
  });

  it('detects iframes on page', async () => {
    const validFrame = createAnnotatableIFrame();
    // Create another that mimics the sidebar iframe
    // This one should should not be detected
    const invalidFrame = createAnnotatableIFrame('dummy-attribute');

    // Now initialize
    createHypothesisInjector();

    await onDocumentReady(validFrame);
    assert.isNotNull(
      getHypothesisScript(validFrame),
      'expected valid iframe to include the Hypothesis script'
    );

    await onDocumentReady(invalidFrame);
    assert.isNull(
      getHypothesisScript(invalidFrame),
      'expected invalid iframe to not include the Hypothesis script'
    );
  });

  it('detects removed iframes', async () => {
    // Create a iframe before initializing
    const iframe = createAnnotatableIFrame();

    // Now initialize
    createHypothesisInjector();
    await onDocumentReady(iframe);

    // Remove the iframe
    iframe.remove();
    await waitForFrameObserver();

    assert.calledWith(fakeBridge.call, 'destroyFrame');
  });

  it('injects embed script in iframe', async () => {
    const iframe = createAnnotatableIFrame();

    createHypothesisInjector();
    await onDocumentReady(iframe);

    const scriptElement = getHypothesisScript(iframe);
    assert.isNotNull(
      scriptElement,
      'expected the iframe to include the Hypothesis script'
    );
    assert.equal(
      scriptElement.src,
      config.clientUrl,
      'unexpected embed script source'
    );
  });

  it('excludes injection from already injected iframes', async () => {
    const iframe = createAnnotatableIFrame();
    iframe.contentWindow.eval('window.__hypothesis = {}');

    createHypothesisInjector();
    await onDocumentReady(iframe);

    assert.isNull(
      getHypothesisScript(iframe),
      'expected iframe to not include the Hypothesis script'
    );
  });

  it('detects dynamically added iframes', async () => {
    // Initialize with no initial iframe, unlike before
    createHypothesisInjector();

    // Add an iframe to the DOM
    const iframe = createAnnotatableIFrame();

    await waitForFrameObserver();
    await onDocumentReady(iframe);
    assert.isNotNull(
      getHypothesisScript(iframe),
      'expected dynamically added iframe to include the Hypothesis script'
    );
  });

  it('detects dynamically removed iframes', async () => {
    // Create a iframe before initializing
    const iframe = createAnnotatableIFrame();

    // Now initialize
    createHypothesisInjector();
    await waitForFrameObserver();
    await onDocumentReady(iframe);

    iframe.remove();
    await waitForFrameObserver();

    assert.calledWith(fakeBridge.call, 'destroyFrame');
  });

  it('detects an iframe dynamically removed, and added again', async () => {
    const iframe = createAnnotatableIFrame();

    // Now initialize
    createHypothesisInjector();
    await onDocumentReady(iframe);

    assert.isNotNull(
      getHypothesisScript(iframe),
      'expected initial iframe to include the Hypothesis script'
    );

    iframe.remove();
    await waitForFrameObserver();

    container.appendChild(iframe);
    assert.isNull(getHypothesisScript(iframe));

    await waitForFrameObserver();
    await onDocumentReady(iframe);

    assert.isNotNull(
      getHypothesisScript(iframe),
      'expected dynamically added iframe to include the Hypothesis script'
    );
  });

  it('detects an iframe dynamically added, removed, and added again', async () => {
    // Initialize with no initial iframe
    createHypothesisInjector();

    // Add an iframe to the DOM
    const iframe = createAnnotatableIFrame();

    await waitForFrameObserver();
    await onDocumentReady(iframe);

    assert.isNotNull(
      getHypothesisScript(iframe),
      'expected dynamically added iframe to include the Hypothesis script'
    );

    iframe.remove();
    await waitForFrameObserver();

    container.appendChild(iframe);
    assert.isNull(getHypothesisScript(iframe));

    await waitForFrameObserver();
    await onDocumentReady(iframe);

    assert.isNotNull(
      getHypothesisScript(iframe),
      'expected dynamically added iframe to include the Hypothesis script'
    );
  });
});
