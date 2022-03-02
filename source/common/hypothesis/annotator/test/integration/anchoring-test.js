// Tests that the expected parts of the page are highlighted when annotations
// with various combinations of selector are anchored.

import Guest from '../../guest';
import { $imports as guestImports } from '../../guest';
import { EventBus } from '../../util/emitter';

function quoteSelector(quote) {
  return {
    type: 'TextQuoteSelector',
    exact: quote,
  };
}

/** Generate an annotation that matches a text quote in a page. */
function annotateQuote(quote) {
  return {
    target: [
      {
        selector: [quoteSelector(quote)],
      },
    ],
  };
}

/**
 * Return the text of all highlighted phrases in `container`.
 *
 * @param {Element} container
 */
function highlightedPhrases(container) {
  return Array.from(container.querySelectorAll('.hypothesis-highlight')).map(
    el => {
      return el.textContent;
    }
  );
}

function simplifyWhitespace(quote) {
  return quote.replace(/\s+/g, ' ');
}

function FakeCrossFrame() {
  this.destroy = sinon.stub();
  this.onConnect = sinon.stub();
  this.on = sinon.stub();
  this.sync = sinon.stub();
}

describe('anchoring', () => {
  let guest;
  let container;

  before(() => {
    guestImports.$mock({
      './cross-frame': { CrossFrame: FakeCrossFrame },
    });
  });

  after(() => {
    guestImports.$restore();
  });

  beforeEach(() => {
    sinon.stub(console, 'warn');
    container = document.createElement('div');
    container.innerHTML = require('./test-page.html');
    document.body.appendChild(container);
    const eventBus = new EventBus();
    guest = new Guest(container, eventBus);
  });

  afterEach(() => {
    guest.destroy();
    container.remove();
    console.warn.restore();
  });

  [
    {
      tag: 'a simple quote',
      quotes: ["This has not been a scientist's war"],
    },
    {
      tag: 'nested quotes',
      quotes: [
        "This has not been a scientist's war;" +
          ' it has been a war in which all have had a part',
        "scientist's war",
      ],
    },
  ].forEach(testCase => {
    it(`should highlight ${testCase.tag} when annotations are loaded`, () => {
      const normalize = function (quotes) {
        return quotes.map(q => {
          return simplifyWhitespace(q);
        });
      };

      const annotations = testCase.quotes.map(q => {
        return annotateQuote(q);
      });

      const anchored = annotations.map(ann => {
        return guest.anchor(ann);
      });

      return Promise.all(anchored).then(() => {
        const assertFn = testCase.expectFail
          ? assert.notDeepEqual
          : assert.deepEqual;
        assertFn(
          normalize(highlightedPhrases(container)),
          normalize(testCase.quotes)
        );
      });
    });
  });
});
