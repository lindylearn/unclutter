# Code documentation

Basic code documentation for extension review and open-source contribution purposes. For more, see the source code at https://github.com/lindylearn/reader-extension.

## Functionality

This browser extension adjusts and changes the CSS of webpages to make them more readable.

## File structure

This web extension uses the following script entry points:

-   `content-script/boot.js` to boostrap the extension functionality inside a tab if the user configured it as such. This minimal script is injected into every tab before DOM construction.
-   `content-script/enhance.js` to enable the full extension functionality inside a tab. This script is only injected for URLs the user allowlisted (as determined by `boot.js`).
-   `background/events.js` to handle persistent background events like extension icon clicks.
-   `background/rewriteCss.js` executed by `events.js` to rewrite a website's CSS, to fullfill the extension functionality.
