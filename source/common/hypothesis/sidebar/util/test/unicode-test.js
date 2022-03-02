import * as unicode from '../unicode';

describe('sidebar/util/unicode', () => {
  describe('fold', () => {
    it('removes hungarian marks', () => {
      const text = 'Fürge rőt róka túlszökik zsíros étkű kutyán';
      const decoded = unicode.fold(unicode.normalize(text));
      const expected = 'Furge rot roka tulszokik zsiros etku kutyan';

      assert.equal(decoded, expected);
    });

    it('removes greek marks', () => {
      const text = 'Καλημέρα κόσμε';
      const decoded = unicode.fold(unicode.normalize(text));
      const expected = 'Καλημερα κοσμε';

      assert.equal(decoded, expected);
    });

    it('removes japanese marks', () => {
      const text = 'カタカナコンバータ';
      const decoded = unicode.fold(unicode.normalize(text));
      const expected = 'カタカナコンハータ';

      assert.equal(decoded, expected);
    });

    it('removes marathi marks', () => {
      const text = 'काचं शक्नोम्यत्तुम';
      const decoded = unicode.fold(unicode.normalize(text));
      const expected = 'कच शकनमयततम';

      assert.equal(decoded, expected);
    });

    it('removes thai marks', () => {
      const text = 'ฉันกินกระจกได้ แต่มันไม่ทำให้ฉันเจ็บ';
      const decoded = unicode.fold(unicode.normalize(text));
      const expected = 'ฉนกนกระจกได แตมนไมทาใหฉนเจบ';

      assert.equal(decoded, expected);
    });

    it('removes all marks', () => {
      const text =
        '̀ ́ ̂ ̃ ̄ ̅ ̆ ̇ ̈ ̉ ̊ ̋ ̌ ̍ ̎ ̏ ̐ ̑ ̒ ̓ ̔ ̕ ̖ ̗ ̘ ̙ ̚ ̛ ̜ ̝ ̞ ̟ ̠ ̡ ̢ ̣ ̤ ̥ ̦ ̧ ̨ ̩ ̪ ̫ ̬ ̭ ̮ ̯ ̰ ̱ ̲ ̳ ̴ ̵ ̶ ̷ ̸ ̹ ̺ ̻ ̼ ̽ ̾ ̿ ̀ ́ ͂ ̓ ̈́ ͅ ͠ ͡"';
      const decoded = unicode.fold(unicode.normalize(text));
      const expected =
        '                                                                       "';

      assert.equal(decoded, expected);
    });
  });
});
