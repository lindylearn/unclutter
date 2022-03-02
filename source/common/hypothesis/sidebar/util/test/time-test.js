import {
  clearFormatters,
  decayingInterval,
  formatDate,
  formatRelativeDate,
  nextFuzzyUpdate,
} from '../time';

const second = 1000;
const minute = second * 60;
const hour = minute * 60;
const day = hour * 24;

describe('sidebar/util/time', () => {
  let sandbox;
  let fakeIntl;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.useFakeTimers();

    fakeIntl = {
      DateTimeFormat: sinon.stub().returns({
        format: sinon.stub(),
      }),
    };
    // Clear the formatters cache so that mocked formatters
    // from one test run don't affect the next.
    clearFormatters();
  });

  afterEach(() => {
    sandbox.restore();
  });

  const fakeDate = isoString => {
    // Since methods like Date.getFullYear output the year in
    // whatever timezone the node timezone is set to, these
    // methods must be mocked/mapped to their UTC equivalents when
    // testing such as getUTCFullYear in order to have timezone
    // agnostic tests.
    // Example:
    // An annotation was posted at 2019-01-01T01:00:00 UTC and now the
    // current date is a few days later; 2019-01-10.
    // - A user in the UK who views the annotation will see “Jan 1”
    //   on the annotation card (correct)
    // - A user in San Francisco who views the annotation will see
    //   “Dec 31, 2018" on the annotation card (also correct from
    //   their point of view).
    const date = new Date(isoString);
    date.getFullYear = sinon.stub().returns(date.getUTCFullYear());
    return date;
  };

  describe('formatRelativeDate', () => {
    it('Handles empty dates', () => {
      const date = null;
      const expect = '';
      assert.equal(formatRelativeDate(date, undefined), expect);
    });

    [
      { now: '1970-01-01T00:00:10.000Z', text: 'Just now' },
      { now: '1970-01-01T00:00:29.000Z', text: 'Just now' },
      { now: '1970-01-01T00:00:49.000Z', text: '49 secs ago' },
      { now: '1970-01-01T00:01:05.000Z', text: '1 min ago' },
      { now: '1970-01-01T00:03:05.000Z', text: '3 mins ago' },
      { now: '1970-01-01T01:00:00.000Z', text: '1 hr ago' },
      { now: '1970-01-01T04:00:00.000Z', text: '4 hrs ago' },
    ].forEach(test => {
      it('creates correct fuzzy string for fixture ' + test.now, () => {
        const timeStamp = fakeDate('1970-01-01T00:00:00.000Z');
        const now = fakeDate(test.now);
        assert.equal(formatRelativeDate(timeStamp, now), test.text);
      });
    });

    [
      {
        now: '1970-01-02T03:00:00.000Z',
        text: '2 Jan',
        options: { day: 'numeric', month: 'short' },
      },
      {
        now: '1970-01-04T00:30:00.000Z',
        text: '4 Jan',
        options: { day: 'numeric', month: 'short' },
      },
      {
        now: '1970-07-03T00:00:00.000Z',
        text: '3 July',
        options: { day: 'numeric', month: 'short' },
      },
      {
        now: '1971-01-01T00:00:00.000Z',
        text: '1 Jan 1970',
        options: { day: 'numeric', month: 'short', year: 'numeric' },
      },
      {
        now: '1971-03-01T00:00:00.000Z',
        text: '1 Jan 1970',
        options: { day: 'numeric', month: 'short', year: 'numeric' },
      },
      {
        now: '1972-01-01T00:00:00.000Z',
        text: '1 Jan 1970',
        options: { day: 'numeric', month: 'short', year: 'numeric' },
      },
      {
        now: '1978-01-01T00:00:00.000Z',
        text: '1 Jan 1970',
        options: { day: 'numeric', month: 'short', year: 'numeric' },
      },
    ].forEach(test => {
      it(
        'passes correct arguments to `Intl.DateTimeFormat.format` for fixture ' +
          test.now,
        () => {
          const timeStamp = fakeDate('1970-01-01T00:00:00.000Z');
          const now = fakeDate(test.now);

          fakeIntl.DateTimeFormat().format.returns(test.text); // eslint-disable-line new-cap
          assert.equal(formatRelativeDate(timeStamp, now, fakeIntl), test.text);
          assert.calledWith(fakeIntl.DateTimeFormat, undefined, test.options);
          assert.calledWith(fakeIntl.DateTimeFormat().format, timeStamp); // eslint-disable-line new-cap
        }
      );
    });
  });

  describe('decayingInterval', () => {
    it('handles empty dates', () => {
      const date = null;
      decayingInterval(date, undefined);
    });

    it('never invokes callback if date is invalid', () => {
      const date = new Date('foo bar');
      const callback = sinon.stub();

      decayingInterval(date, callback);
      sandbox.clock.tick(600 * day);

      assert.notCalled(callback);
    });

    it('uses a short delay for recent timestamps', () => {
      const date = new Date().toISOString();
      const callback = sandbox.stub();
      decayingInterval(date, callback);
      sandbox.clock.tick(6 * second);
      assert.called(callback);
      sandbox.clock.tick(6 * second);
      assert.calledTwice(callback);
    });

    it('uses a longer delay for older timestamps', () => {
      const date = new Date().toISOString();
      const ONE_MINUTE = minute;
      sandbox.clock.tick(10 * ONE_MINUTE);
      const callback = sandbox.stub();
      decayingInterval(date, callback);
      sandbox.clock.tick(ONE_MINUTE / 2);
      assert.notCalled(callback);
      sandbox.clock.tick(ONE_MINUTE);
      assert.called(callback);
      sandbox.clock.tick(ONE_MINUTE);
      assert.calledTwice(callback);
    });

    it('returned function cancels the timer', () => {
      const date = new Date().toISOString();
      const callback = sandbox.stub();
      const cancel = decayingInterval(date, callback);
      cancel();
      sandbox.clock.tick(minute);
      assert.notCalled(callback);
    });

    it('does not set a timeout for dates > 24hrs ago', () => {
      const date = new Date().toISOString();
      const ONE_DAY = day;
      sandbox.clock.tick(10 * ONE_DAY);
      const callback = sandbox.stub();

      decayingInterval(date, callback);
      sandbox.clock.tick(ONE_DAY * 2);

      assert.notCalled(callback);
    });
  });

  describe('nextFuzzyUpdate', () => {
    it('handles empty dates', () => {
      const date = null;
      const expect = null;
      assert.equal(nextFuzzyUpdate(date, undefined), expect);
    });

    it('returns `null` if date is invalid', () => {
      const date = new Date('foo bar');
      assert.equal(nextFuzzyUpdate(date), null);
    });

    it('returns `null` if "now" date is invalid', () => {
      const date = new Date();
      const now = new Date('foo bar');
      assert.equal(nextFuzzyUpdate(date, now), null);
    });

    [
      { now: '1970-01-01T00:00:10.000Z', expectedUpdateTime: 5 * second }, // we have a minimum of 5 secs
      { now: '1970-01-01T00:00:20.000Z', expectedUpdateTime: 5 * second },
      { now: '1970-01-01T00:00:49.000Z', expectedUpdateTime: 5 * second },
      { now: '1970-01-01T00:01:05.000Z', expectedUpdateTime: minute },
      { now: '1970-01-01T00:03:05.000Z', expectedUpdateTime: minute },
      { now: '1970-01-01T04:00:00.000Z', expectedUpdateTime: hour },
      { now: '1970-01-02T03:00:00.000Z', expectedUpdateTime: null },
      { now: '1970-01-04T00:30:00.000Z', expectedUpdateTime: null },
      { now: '1970-07-02T00:00:00.000Z', expectedUpdateTime: null },
      { now: '1978-01-01T00:00:00.000Z', expectedUpdateTime: null },
    ].forEach(test => {
      it('gives correct next fuzzy update time for fixture ' + test.now, () => {
        const timeStamp = fakeDate('1970-01-01T00:00:00.000Z');
        const now = fakeDate(test.now);
        assert.equal(nextFuzzyUpdate(timeStamp, now), test.expectedUpdateTime);
      });
    });
  });

  describe('formatDate', () => {
    it('returns absolute formatted date', () => {
      const date = new Date('2020-05-04T23:02:01');
      const fakeIntl = locale => ({
        DateTimeFormat: function (_, options) {
          return new Intl.DateTimeFormat(locale, options);
        },
      });

      assert.equal(
        formatDate(date, fakeIntl('en-US')),
        'Monday, May 04, 2020, 11:02 PM'
      );

      clearFormatters();

      assert.equal(
        formatDate(date, fakeIntl('de-DE')),
        'Montag, 04. Mai 2020, 23:02'
      );
    });
  });
});
