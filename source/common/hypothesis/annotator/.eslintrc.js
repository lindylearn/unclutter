// eslint-disable-next-line
'use strict';

module.exports = {
  rules: {
    'no-restricted-properties': [
      2,
      {
        // Disable `bind` usage in annotator/ code to prevent unexpected behavior
        // due to broken bind polyfills. See
        // https://github.com/hypothesis/client/issues/245
        property: 'bind',
        message:
          'Use function expressions instead of bind() in annotator/ code',
      },
    ],
  },
};
