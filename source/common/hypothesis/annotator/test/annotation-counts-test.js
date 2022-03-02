import annotationCounts from '../annotation-counts';

describe('annotationCounts', () => {
  let countEl1;
  let countEl2;
  let CrossFrame;
  let fakeCrossFrame;
  let sandbox;

  beforeEach(() => {
    CrossFrame = null;
    fakeCrossFrame = {};
    sandbox = sinon.createSandbox();

    countEl1 = document.createElement('button');
    countEl1.setAttribute('data-hypothesis-annotation-count', '');
    document.body.appendChild(countEl1);

    countEl2 = document.createElement('button');
    countEl2.setAttribute('data-hypothesis-annotation-count', '');
    document.body.appendChild(countEl2);

    fakeCrossFrame.on = sandbox.stub().returns(fakeCrossFrame);

    CrossFrame = sandbox.stub();
    CrossFrame.returns(fakeCrossFrame);
  });

  afterEach(() => {
    sandbox.restore();
    countEl1.remove();
    countEl2.remove();
  });

  describe('listen for "publicAnnotationCountChanged" event', () => {
    const emitEvent = function () {
      let crossFrameArgs;
      let evt;
      let fn;

      const event = arguments[0];
      const args =
        2 <= arguments.length ? Array.prototype.slice.call(arguments, 1) : [];

      crossFrameArgs = fakeCrossFrame.on.args;
      for (let i = 0, len = crossFrameArgs.length; i < len; i++) {
        evt = crossFrameArgs[i][0];
        fn = crossFrameArgs[i][1];

        if (event === evt) {
          fn.apply(null, args);
        }
      }
    };

    it('displays the updated annotation count on the appropriate elements', () => {
      const newCount = 10;
      annotationCounts(document.body, fakeCrossFrame);

      emitEvent('publicAnnotationCountChanged', newCount);

      assert.equal(countEl1.textContent, newCount);
      assert.equal(countEl2.textContent, newCount);
    });
  });
});
