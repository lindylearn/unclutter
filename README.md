# Unclutter - Immersive Reading Mode

A browser extension to remove distractions from web articles.

![intro](https://user-images.githubusercontent.com/23430759/171190664-b9927344-8ce5-4a78-9516-7bc638a3c425.gif)

## Installation

Try out the extension from the Chrome or Firefox extension store:

[<img src="./media/chrome-badge.png" height="80">](https://chrome.google.com/webstore/detail/unclutter-immersive-readi/ibckhpijbdmdobhhhodkceffdngnglpk)
[<img src="./media/firefox-badge.png" height="65" style="margin-bottom: 6px;">](https://addons.mozilla.org/en-GB/firefox/addon/lindylearn/)

## Features

-   Remove distractions like ads, cookie banners & popups.
-   Customize font size and color theme across all websites.
-   Quickly navigate between chapters.
-   Find memorable quotes discussed on Hacker News.
-   Save highlights by simply selecting text.

## How this works

Unlike every other "reader mode", this extension modifies the HTML of article pages instead of replacing it. This improves readability without making all pages look the same, but creates additional challenges since everyone uses CSS differently.

The main "trick" is to use a website's responsive style to hide non-essential page elements for us (by [parsing & applying these rules in the CSSOM](source/content-script/modifications/CSSOM/responsiveStyle.ts)).
For other annoyances there are [global](source/content-script/modifications/contentBlock.ts) and [site-specific](source/content-script/pageview/manualContentBlock.css) blocklists based on CSS class naming.

To standardize margins, background colors, and font-sizes, the extension also [applies custom CSS](source/content-script/modifications/DOM/textContainer.ts) to text elements it finds in the DOM (with logic to detect what's the main article text). The dark mode feature uses a combination of [DOM and CSSOM iterations](source/content-script/modifications/CSSOM/theme.ts) to darken colors, change the background, or enable a website's native dark mode styles if present.

To tie these (and many more) page modifications together, they each hook into 8 lifecycle phases coordinated from [transitions.ts](source/content-script/transitions.ts). The major concern here is performance -- minimizing reflows while performing changes stepwise so that they look nice when animated.

Beyond this core functionality there are embedded React apps to power the [annotations / highlights feature](source/sidebar/App.tsx) and [extension settings page](source/settings-page/Options.tsx), Svelte components for the [lightweight UI controls](source/overlay) including the page outline, and [background event handling code](source/background/events.ts) to inject scripts into visited pages and tie other things together.

Fore more details refer to (incomplete) docs files in [/docs](docs).

## Contributing

The main way you can help is to [report](https://github.com/lindylearn/unclutter/issues) bugs, broken articles pages, UI inconsistencies, or ideas on how to improve the extension.

If you want something to be fixed faster (like a CSS bug), it may help to do it yourself. Please let me know if the docs pages and inline comments are not sufficient (which is likely).

## Development

To build the extension yourself, run:

1. `yarn install && yarn build`
2. `yarn package`
3. Find the bundled extension code in `/web-ext-artifacts`. `_manifest-v2` is for Firefox, `_manifest-v3` for Chromium browsers.

I run this using node `v16.14.0` on Mac, then upload the bundled code to the Chrome and Mozilla extension stores manually. The bundling uses Rollup to create a somewhat readable output -- so feel free to check the released code in your browser's profile folder if you installed the extension.

For hot reloading during development, run `yarn watch` and `npx web-ext run` in parallel.

## Licence

The extension code is released under the [Simplified BSD License](https://choosealicense.com/licenses/bsd-2-clause/), which excludes any liability for bugs you find. The project is part of the [LindyLearn](http://lindylearn.io/) suite of tools.

The private notes and social highlights feature uses code from the annotator subcomponent of [hypothesis/client](https://github.com/hypothesis/client) to anchor text on webpages. See [LICENCE](https://github.com/lindylearn/annotations/blob/main/LICENCE) for the legal boilerplate.
