# Unclutter - Immersive Reading Mode

A browser extension to automatically remove distractions from web articles.

[<img src="./media/chrome-badge.png" height="80">](https://chrome.google.com/webstore/detail/unclutter-immersive-readi/ibckhpijbdmdobhhhodkceffdngnglpk)
[<img src="./media/firefox-badge.png" height="65" style="margin-bottom: 6px;">](https://addons.mozilla.org/en-GB/firefox/addon/lindylearn/)

## Demo video

![Demo video](./media/design-demo.gif)

## Features

-   Rewrites a website's CSS to use simplified responsive styles even at larger viewports.
-   Removes distracting headers, sidebars, cookie banners, or promotion messages through global and site-specific style overrides.
-   Allows to make text more readable through font size, page width, and color theme settings. This includes a dark mode!
-   Can automatically activate on certain domains.
-   More to come :)

## Contributing

Please open an issue for anything that seems broken or could work better.

<!-- The extension sidebar shows public web annotations and quote comments from Hacker News. If you link your [hypothes.is](https://web.hypothes.is) account it also shows your private annotations and highlights. On many older articles there will be graph of social references to that link over time.

If you're logged in and the annotations sidebar is open, selecting any text on the webpage will create a private highlight. Optionally you can add a note or tags separated by `", "`. All edits are automatically synchronized with your hypothes.is account. If you want to talk about one of your notes, make it public by toggling the switch on that annotation. -->

## Development

To build the extension yourself, run:

1. `yarn install && yarn build`
2. `yarn package`
3. Find the bundled extension code in `/web-ext-artifacts`. `_manifest-v2` is for Firefox, `_manifest-v3` for Chromium browsers.

This was tested using node `v17.6.0` and yarn `1.22.17` on Mac, but should work the same in other environments. See `source/README.me` for some documentation on the code structure.

For hot reloading during development, run `yarn watch` and `npx web-ext run` in parallel.

## License

<!-- This project is a simplified rewrite of the official Hypothes.is browser extension. It uses a few code pieces of it, particularly the "annotator" component to anchor text on webpages.  -->

See [LICENSE](https://github.com/lindylearn/annotations/blob/main/LICENCE) for details.
