import { applyTheme } from '../theme';

describe('sidebar/helpers/theme', () => {
  let fakeSettings;

  beforeEach(() => {
    fakeSettings = {
      branding: {
        accentColor: '#f00', // color
        appBackgroundColor: '#0f0', // backgroundColor
        ctaBackgroundColor: '#00f', // backgroundColor
        ctaTextColor: '#00f', // color
        selectionFontFamily: 'Times New Roman', // fontFamily
        annotationFontFamily: 'Helvetica', // fontFamily
      },
    };
  });

  it('populates the style object with values for defined, supported theme props', () => {
    const style = applyTheme(
      ['accentColor', 'appBackgroundColor', 'selectionFontFamily'],
      fakeSettings
    );

    assert.include(style, {
      color: '#f00',
      backgroundColor: '#0f0',
      fontFamily: 'Times New Roman',
    });
  });

  it('overwrites a prop value with one later in the passed properties if conflicting', () => {
    const style = applyTheme(['ctaTextColor', 'accentColor'], fakeSettings);

    assert.include(style, {
      color: '#f00',
    });
  });

  it('does not add style rules for properties not in whitelist', () => {
    fakeSettings.branding.foobar = 'left';
    const style = applyTheme(['foobar', 'selectionFontFamily'], fakeSettings);

    assert.hasAllKeys(style, ['fontFamily']);
  });

  it('does not add style rules for values not defined in settings', () => {
    fakeSettings.branding = {
      appBackgroundColor: '#0f0',
    };
    const style = applyTheme(
      ['appBackgroundColor', 'ctaTextColor'],
      fakeSettings
    );

    assert.hasAllKeys(style, ['backgroundColor']);
    assert.doesNotHaveAnyKeys(style, ['color']);
  });

  it('does not add any style rules if no branding settings', () => {
    fakeSettings = {};

    const style = applyTheme(
      ['appBackgroundColor', 'ctaTextColor'],
      fakeSettings
    );

    assert.isEmpty(style);
  });
});
