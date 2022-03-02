import filterAnnotations, { $imports } from '../view-filter';

function isoDateWithAge(age) {
  return new Date(Date.now() - age * 1000).toISOString();
}

const poem = {
  tiger: `Tyger Tyger, burning bright
          In the forest of the night;
          What immortal  hand  or eye,
          Could frame thy fearful symmetry?`,
  raven: `Once upon a midnight dreary, when I pondered, weak and weary,
          Over many a quaint and curious volume of forgotten lore-
          While I nodded, nearly napping, suddely there came a tapping,
          As of some one gently rapping, rapping at my chamber door.
          “’Tis some visitor,” I muttered, “tapping at my chamber door—
          Only this and nothing more.”`,
};

describe('sidebar/helpers/view-filter', () => {
  let fakeUnicode;

  beforeEach(() => {
    fakeUnicode = {
      fold: sinon.stub().returnsArg(0),
      normalize: sinon.stub().returnsArg(0),
    };

    $imports.$mock({
      '../util/unicode': fakeUnicode,
    });
  });

  afterEach(() => {
    $imports.$restore();
  });

  describe('#filter', () => {
    it('applies unicode-aware case folding to filter terms', () => {
      const filters = {
        text: { terms: ['Tiger'], operator: 'and' },
      };

      filterAnnotations([], filters);

      assert.calledWith(fakeUnicode.fold, 'Tiger');
    });
  });

  describe('filter operators', () => {
    let annotations;

    beforeEach(() => {
      annotations = [
        { id: 1, text: poem.tiger },
        { id: 2, text: poem.raven },
      ];
    });

    it('requires all terms to match for "and" operator', () => {
      const filters = {
        text: { terms: ['Tyger', 'burning', 'bright'], operator: 'and' },
      };

      const result = filterAnnotations(annotations, filters);

      assert.deepEqual(result, [1]);
    });

    it('requires at least one term to match for "or" operator', () => {
      const filters = {
        text: { terms: ['Tyger', 'quaint'], operator: 'or' },
      };

      const result = filterAnnotations(annotations, filters);

      assert.equal(result.length, 2);
    });
  });

  describe('"any" field', () => {
    it('finds matches in any field', () => {
      const annotations = [
        { id: 1, text: poem.tiger, target: [{}] },
        { id: 4, user: 'lion', target: [{}] },
        { id: 2, user: 'Tyger', target: [{}] },
        { id: 3, tags: ['Tyger'], target: [{}] },
      ];
      const filters = { any: { terms: ['Tyger'], operator: 'and' } };

      const result = filterAnnotations(annotations, filters);

      assert.equal(result.length, 3);
    });

    it('matches if combined fields match "and" query', () => {
      const annotation = {
        id: 1,
        text: poem.tiger,
        target: [
          {
            selector: [
              {
                type: 'TextQuoteSelector',
                exact: 'The Tyger by William Blake',
              },
            ],
          },
        ],
        user: 'acct:poe@edgar.com',
        tags: ['poem', 'Blake', 'Tyger'],
      };

      // A query which matches the combined fields from the annotation, but not
      // individual fields on their own.
      const filters = {
        any: {
          terms: ['burning', 'William', 'poem', 'bright'],
          operator: 'and',
        },
      };

      const result = filterAnnotations([annotation], filters);

      assert.equal(result.length, 1);
    });
  });

  describe('"uri" field', () => {
    it("matches if the query occurs in the annotation's URI", () => {
      const annotation = {
        id: 1,
        uri: 'https://publisher.org/article',
      };
      const filters = { uri: { terms: ['publisher'], operator: 'or' } };

      const result = filterAnnotations([annotation], filters);

      assert.deepEqual(result, [1]);
    });
  });

  describe('"user" field', () => {
    let id = 0;
    function annotationWithUser(username, displayName = null) {
      ++id;
      return {
        id,
        user: `acct:${username}@example.com`,
        user_info: {
          display_name: displayName,
        },
      };
    }

    function userQuery(term) {
      return { user: { terms: [term], operator: 'or' } };
    }

    it('matches username', () => {
      const anns = [
        annotationWithUser('johnsmith'),
        annotationWithUser('jamesdean'),
        annotationWithUser('johnjones'),
      ];
      const result = filterAnnotations(anns, userQuery('john'));

      assert.deepEqual(result, [anns[0].id, anns[2].id]);
    });

    it("matches user's display name if present", () => {
      const anns = [
        // Users with display names set.
        annotationWithUser('jsmith', 'John Smith'),
        annotationWithUser('jdean', 'James Dean'),
        annotationWithUser('jherriot', 'James Herriot'),
        annotationWithUser('jadejames', 'Jade'),

        // User with no display name.
        annotationWithUser('fmercury'),

        // Annotation with no extended user info.
        { id: 100, user: 'acct:jim@example.com' },
      ];
      const result = filterAnnotations(anns, userQuery('james'));

      assert.deepEqual(result, [anns[1].id, anns[2].id, anns[3].id]);
    });

    it('ignores display name if not set', () => {
      const anns = [annotationWithUser('msmith')];
      const result = filterAnnotations(anns, userQuery('null'));
      assert.deepEqual(result, []);
    });
  });

  describe('"since" field', () => {
    it('matches if the annotation is newer than the query', () => {
      const annotation = {
        id: 1,
        updated: isoDateWithAge(50),
        target: [{}],
      };
      const filters = {
        since: { terms: [100], operator: 'and' },
      };

      const result = filterAnnotations([annotation], filters);

      assert.deepEqual(result, [1]);
    });

    it('does not match if the annotation is older than the query', () => {
      const annotation = {
        id: 1,
        updated: isoDateWithAge(150),
        target: [{}],
      };
      const filters = {
        since: { terms: [100], operator: 'and' },
      };

      const result = filterAnnotations([annotation], filters);

      assert.deepEqual(result, []);
    });
  });

  it('ignores filters with no terms in the query', () => {
    const annotation = {
      id: 1,
      tags: ['foo'],
      target: [{}],
    };
    const filters = {
      any: {
        terms: ['foo'],
        operator: 'and',
      },
      tag: {
        terms: [],
        operator: 'and',
      },
    };

    const result = filterAnnotations([annotation], filters);

    assert.deepEqual(result, [1]);
  });

  it('ignores annotations (drafts) with no id', () => {
    const annotation = {
      tags: ['foo'],
      target: [{}],
    };
    const filters = {
      any: {
        terms: ['foo'],
        operator: 'and',
      },
    };

    const result = filterAnnotations([annotation], filters);

    assert.deepEqual(result, []);
  });
});
