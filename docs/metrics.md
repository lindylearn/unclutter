# Privacy policy

The Unclutter browser extension is provided for free, without any required sign-up or collection of personal information. **In particular, no information is collected about the webpages you visit.**

The extension reports technical usage metrics and error logs in order to understand which features work as expected and which do not.

## Specific features

To implement the configurable automatic activation on article domains, Unclutter has the permission to "read and change all your data on websites that you visit" by default. In practice this means [a small script](https://github.com/lindylearn/unclutter/blob/main/source/content-script/boot.ts) locally checks each URL against your settings and optionally triggers the reader mode as if you clicked on the extension icon.
**If you do not use this feature you can simply revoke the "Site access" permission from the Unclutter extension.**

The optional [social highlights](./social-highlights.md) feature sends a network request to fetch highlights for articles you activate the reader mode on. This network request contains only the SHA256 one-way hash of the normalized page URL, containing no query parameters or user identification.

The number of social highlights on the Unclutter extension icon works without network requests by periodically downloading a [static CSV](./social-highlights.md#privacy) file.

If you enable the [Hypothes.is sync](./annotations.md.md) feature after signing up for an account there, your private notes will be uploaded to their service and are subject to their [privacy policy](https://web.hypothes.is/privacy/).

## Unclutter Library

If you sign up for the work-in-progress Unclutter Library beta and connect your account to the Unclutter extension, articles you activate the reader mode on will be saved to your account and categorized per topic.
Your reading progress and created private notes will also be saved remotely.

The seperate work-in-progress Unclutter Library extension also does not collect any personal information or information about the web pages you visit.
It has the permission to access your browser bookmarks and frequently-visited websites solely in order to display them on the New Tab page it replaces, and does not save or send this data anywhere.

The URLs, topics, and notes in your Unclutter Library account are not accessible to any third parties.

## Verification and Open Source

To verify any part of this pricacy policy, simply browse the code on Github or where you downloaded the extension to. The extension is bundled in a way to be as readable as possible

For example, you can [search](https://github.com/lindylearn/unclutter/search?q=reportEvent) for references of `reportEvent()` to check which usage metrics are reported.

## Warranty

See [LICENCE](../LICENCE) for details.

| 🐛     **Any concern with this? Please [open an issue](https://github.com/lindylearn/unclutter/issues/new) for it!** |
| -------------------------------------------------------------------------------------------------------------------- |
