# Code documentation

## Basic structure

-   `background` contains the extension background script that listens to clicks to the extension icon, and sends events to the content script.
-   `content-script` contains code that is injected into the active tab by the background script. It calls the "page view" feature initialization and configures listeners to user selection and annotation update events. `content-scrip/annotationApi.js` supports the highlighting of text on the active webpage.
-   `pageview` configures the annotations sidebar and related CSS changes.
-   `sidebar` contains the annotations sidebar that is injected as iframe into the active tab. All data fetching and synchronization happens here to isolate it from the webpage.
-   `options` contains the React code for the browser extension settings page.

## Security implications

-   The extension only has access to user tabs when the user clicks its icon.
-   The HTMl of the active browser tab is then modified to show annotation information, and to capture user text selections (which create visible annotations in the sidebar).
-   All user notes and backend communication is contained within the inserted iframe, so the active website has no access to it. The React annotation sidebar only has access to the active website via the limited event communication defined in `content-script/annotationListener.js` and `content-script/selectionListener.js`.
