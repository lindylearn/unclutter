import { isMacOS, isIOS, isTouchDevice } from '../user-agent';

describe('shared/user-agent', () => {
  describe('isMacOS', () => {
    it('returns true when the user agent is a Mac', () => {
      assert.isTrue(
        isMacOS(
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36'
        )
      );
    });

    it('returns false when the user agent is not a Mac', () => {
      assert.isFalse(
        isMacOS(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.92 Safari/537.36 Edg/80.0.361.109'
        )
      );
    });
  });

  describe('isTouchDevice', () => {
    let matchMedia;

    beforeEach(() => {
      matchMedia = sinon.spy(window, 'matchMedia');
    });

    afterEach(() => {
      window.matchMedia.restore();
    });

    it('calls `window.matchMedia` with the query string "(pointer: coarse)"', () => {
      isTouchDevice(window);
      assert.calledWith(matchMedia, '(pointer: coarse)');
    });
  });

  describe('isIOS', () => {
    it('returns true when the user agent is an iOS', () => {
      assert.isBoolean(isIOS()); // Test to check default parameters
      assert.isTrue(
        isIOS({ platform: 'iPad Simulator', userAgent: 'dummy' }, false)
      );
      assert.isTrue(
        isIOS({ platform: 'iPhone Simulator', userAgent: 'dummy' }, false)
      );
      assert.isTrue(
        isIOS({ platform: 'iPod Simulator', userAgent: 'dummy' }, false)
      );
      assert.isTrue(isIOS({ platform: 'iPad', userAgent: 'dummy' }, false));
      assert.isTrue(isIOS({ platform: 'iPhone', userAgent: 'dummy' }, false));
      assert.isTrue(isIOS({ platform: 'iPod', userAgent: 'dummy' }, false));
      assert.isTrue(isIOS({ platform: 'dummy', userAgent: 'Mac' }, true));
    });

    it('returns false when the user agent is not an iOS', () => {
      assert.isFalse(isIOS({ platform: 'dummy', userAgent: 'dummy' }, true));
      assert.isFalse(isIOS({ platform: 'dummy', userAgent: 'Mac' }, false));
    });
  });
});
