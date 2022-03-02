import { StreamFilter } from '../stream-filter';

describe('StreamFilter', () => {
  describe('#addClause', () => {
    [
      {
        field: '/uri',
        operator: 'one_of',
        value: ['https://example.com', 'doi:1234'],
      },
      {
        field: '/id',
        operator: 'equals',
        value: '1234',
      },
      {
        field: '/references',
        operator: 'one_of',
        value: ['1234', '5678'],
      },
    ].forEach(({ field, operator, value }) => {
      it('generates filter configurations', () => {
        const filter = new StreamFilter();

        filter.addClause(field, operator, value);

        const config = filter.getFilter();
        assert.deepEqual(config, {
          match_policy: 'include_any',
          clauses: [
            {
              field,
              operator,
              value,
              case_sensitive: false,
            },
          ],
          actions: {
            create: true,
            update: true,
            delete: true,
          },
        });
      });
    });

    it('is chainable', () => {
      const filter = new StreamFilter();
      assert.equal(filter.addClause('/id', 'equals', '123'), filter);
    });
  });

  describe('#resetFilter', () => {
    it('resets the configuration', () => {
      const filter = new StreamFilter();

      filter.addClause('/uri', 'one_of', ['https://example.com']);
      filter.resetFilter();

      const config = filter.getFilter();
      assert.deepEqual(config, {
        match_policy: 'include_any',
        clauses: [],
        actions: {
          create: true,
          update: true,
          delete: true,
        },
      });
    });

    it('is chainable', () => {
      const filter = new StreamFilter();
      assert.equal(filter.resetFilter(), filter);
    });
  });
});
