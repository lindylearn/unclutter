import * as random from '../random';

describe('sidebar.util.random', () => {
  describe('#generateHexString', () => {
    [2, 4, 8, 16].forEach(len => {
      it(`returns a ${len} digit hex string`, () => {
        const re = new RegExp(`^[0-9a-fA-F]{${len}}$`);
        const str = random.generateHexString(len);
        assert.isTrue(re.test(str));
      });
    });
  });
});
