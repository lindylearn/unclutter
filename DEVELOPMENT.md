# Unclutter Development

Thank you for the interest in contributing! This project is open-source because no single person or company can build a reader that works for everyone. If you want a some new feature, the surest way is to implement it yourself :)

Please open an issue if you have any question!

## How Unclutter works

The main "trick" is to use a website's responsive style to hide non-essential page elements for us (by [parsing & applying these rules in the CSSOM](apps/unclutter/source/content-script/modifications/CSSOM/responsiveStyle.ts)).
For other annoyances there are [global](apps/unclutter/source/content-script/modifications/contentBlock.ts) and [site-specific](apps/unclutter/source/content-script/pageview/siteTweaks.css) blocklists based on CSS class naming.

To standardize margins, background colors, and font-sizes, the extension also [applies custom CSS](apps/unclutter/source/content-script/modifications/DOM/textContainer.ts) to text elements it finds in the DOM (with logic to detect what's the main article text). The dark mode feature uses a combination of [DOM and CSSOM iterations](apps/unclutter/source/content-script/modifications/CSSOM/theme.ts) to darken colors, change the background, or enable a website's native dark mode styles if present.

To tie these (and many more) page modifications together, they each hook into 8 lifecycle phases coordinated from [transitions.ts](apps/unclutter/source/content-script/transitions.ts). The major concern here is performance -- minimizing reflows while performing changes stepwise so that they look nice when animated.

Beyond this core functionality there are embedded React iframes to power the [social comments & highlights features](apps/unclutter/source/sidebar/App.tsx) and the [extension settings page](apps/unclutter/source/settings-page/Options.tsx), Svelte components for the [UI controls](apps/unclutter/source/overlay) including the page outline, and [background event handling code](apps/unclutter/source/background/events.ts) to inject scripts into visited pages and handle events.

**For documentation on individual features see the [docs pages](https://github.com/lindylearn/unclutter/blob/main/docs).**

## Project structure

Besides the Unclutter reader mode extension, this repo also contains code for the Unclutter New Tab extension, a semi-deprecated website for the Unclutter article library, and a serverless Node.js service to generate article screenshots. See the different subfolders of `apps`.

`common` contains code shared by two or more of theses apps, notably `library-components` for UI elements of the Unclutter library, and `replicache-nextjs` the server-side code to synchronize the library via [Replicache](https://replicache.dev).

## Development

Install all monorepo dependencies by running `yarn install` and `yarn build` at the root of the project.

To develop the Unclutter extension, `cd` into `apps/unclutter` and run `yarn build` to build your code changes. You can then run `yarn chrome` to start a Chromium window that reloads the extension code every time you build the code (or `yarn firefox` for Firefox).

For hot reloading of the `common` packages run `yarn dev` at the root of the project.

## Release process

`yarn package` inside any of the extension folders generates the bundled `.zip` extension files.
These need to be manually uploaded to the Chrome and Firefox extension stores by @phgn0. For Chrome, extension releases usually take 1-4 days to be approved due to their review process. 

The `apps/library-web` website and `apps/serverless-screenshots` service are infrequently deployed on demand.
