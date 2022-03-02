import { TagsService } from '../tags';

const TAGS_LIST_KEY = 'hypothesis.user.tags.list';
const TAGS_MAP_KEY = 'hypothesis.user.tags.map';

class FakeStorage {
  constructor() {
    this._storage = {};
  }

  getObject(key) {
    return this._storage[key];
  }

  setObject(key, value) {
    this._storage[key] = value;
  }
}

describe('TagsService', () => {
  let fakeLocalStorage;
  let tags;

  beforeEach(() => {
    fakeLocalStorage = new FakeStorage();

    const stamp = Date.now();
    const savedTagsMap = {
      foo: {
        text: 'foo',
        count: 1,
        updated: stamp,
      },
      bar: {
        text: 'bar',
        count: 5,
        updated: stamp,
      },
      'bar argon': {
        text: 'bar argon',
        count: 2,
        updated: stamp,
      },
      banana: {
        text: 'banana',
        count: 2,
        updated: stamp,
      },
      future: {
        text: 'future',
        count: 2,
        updated: stamp,
      },
      argon: {
        text: 'argon',
        count: 1,
        updated: stamp,
      },
      ინგლისური: {
        // Non-ASCII characters. This is "English" in Georgian
        text: 'ინგლისური',
        count: 1,
        updated: stamp,
      },
      '^žŸ¡\\¢£¤': {
        // Non-word ASCII with special regex chars
        text: '^žŸ¡\\¢£¤',
        count: 1,
        updated: stamp,
      },
    };
    const savedTagsList = Object.keys(savedTagsMap);

    fakeLocalStorage.setObject(TAGS_MAP_KEY, savedTagsMap);
    fakeLocalStorage.setObject(TAGS_LIST_KEY, savedTagsList);

    tags = new TagsService(fakeLocalStorage);
  });

  describe('#filter', () => {
    it('returns tags that start with the query string', () => {
      assert.deepEqual(tags.filter('b'), ['bar', 'bar argon', 'banana']);
    });

    it('returns tags that have any word starting with the query string', () => {
      assert.deepEqual(tags.filter('ar'), ['bar argon', 'argon']);
    });

    it('is case insensitive', () => {
      assert.deepEqual(tags.filter('Ar'), ['bar argon', 'argon']);
    });

    it('limits tags when provided a limit value', () => {
      assert.deepEqual(tags.filter('b', 1), ['bar']);
      assert.deepEqual(tags.filter('b', 2), ['bar', 'bar argon']);
      assert.deepEqual(tags.filter('b', 3), ['bar', 'bar argon', 'banana']);
    });

    it('returns non-word ASCII tags that start with the query string', () => {
      assert.deepEqual(tags.filter('^žŸ¡\\'), ['^žŸ¡\\¢£¤']);
    });

    it('returns non-ASCII tags that start with the query string', () => {
      assert.deepEqual(tags.filter('ინ'), ['ინგლისური']);
    });
  });

  describe('#store', () => {
    it('saves new tags to storage', () => {
      tags.store(['new']);

      const storedTagsList = fakeLocalStorage.getObject(TAGS_LIST_KEY);
      assert.include(storedTagsList, 'new');

      const storedTagsMap = fakeLocalStorage.getObject(TAGS_MAP_KEY);
      assert.match(
        storedTagsMap.new,
        sinon.match({
          count: 1,
          text: 'new',
          updated: sinon.match.number,
        })
      );
    });

    it('increases the count for a tag already stored', () => {
      tags.store(['bar']);
      const storedTagsMap = fakeLocalStorage.getObject(TAGS_MAP_KEY);
      assert.equal(storedTagsMap.bar.count, 6);
    });

    it('orders list by count descending, lexical ascending', () => {
      for (let i = 0; i < 6; i++) {
        tags.store(['foo']);
      }

      const storedTagsList = fakeLocalStorage.getObject(TAGS_LIST_KEY);
      assert.deepEqual(storedTagsList, [
        'foo',
        'bar',
        'banana',
        'bar argon',
        'future',
        '^žŸ¡\\¢£¤',
        'argon',
        'ინგლისური',
      ]);
    });
  });
});
