# Privacy policy

The Unclutter browser extension is provided for free, without any required sign-up or collection of personal information. **In particular, no information is collected about the webpages you visit or on which you activate the reader mode on.**

The extension does report usage metrics and error logs in order to understand which features work as expected and which do not.

## Specific features

To implement the configurable automatic activation on article domains, Unclutter has the permission to "read and change all your data on websites that you visit" by default. In practice this means [a small script](https://github.com/lindylearn/unclutter/blob/main/source/content-script/boot.ts) locally checks each URL against your settings and optionally triggers the reader mode as if you clicked on the extension icon.
**If you do not use this feature you can simply revoke the "Site access" permission from the Unclutter extension.**

The optional [social highlights](./social-highlights.md) feature sends a network request to fetch highlights for articles you activate the reader mode on. This network request contains only the SHA256 one-way hash of the normalized page URL, containing no query parameters or user identification.

The number of social highlights on the Unclutter extension icon works without network requests by periodically downloading a [static CSV](./social-highlights.md#privacy) file.

If you enable the [Hypothes.is sync](./annotations.md.md) feature after signing up for an account there, your private notes will be uploaded to their service and are subject to their [privacy policy](https://web.hypothes.is/privacy/).

## Verification and Open Source

To verify any part of this pricacy policy, simply browse the code on Github or where you downloaded the extension to. The extension is bundled in a way to be as readable as possible

For example, you can [search](https://github.com/lindylearn/unclutter/search?q=reportEvent) for references of `reportEvent()` to check which usage metrics are reported.

## Warranty

See [LICENCE](../LICENCE) for details.

| 🐛     **Any concern with this? Please [open an issue](https://github.com/lindylearn/unclutter/issues/new) for it!** |
| -------------------------------------------------------------------------------------------------------------------- |
