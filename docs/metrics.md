# Privacy

The Unclutter browser extension is provided for free, without any sign-up or opportunity to enter personal information. All data (the extension settings and private notes) stays in your browser.

The optional [social highlights](./social-highlights.md) feature send a network request to fetch the highlights for articles you activate the extension on. This network request contains only the SHA256 hash of the normalized page UR (removing query parameters) with no user identification, which makes it near impossible to see which articles you read.

The number of social highlights on the Unclutter extension icon works without network requests by periodically downloading a [static CSV](./social-highlights.md#privacy) and checking it locally.

If you enable the [Hypothes.is sync](./annotations.md.md) feature, your private notes will be uploaded to their service and subject to their [privacy policy](https://web.hypothes.is/privacy/).

Unclutter does collect usage metrics in order to understand how it is used (or not used). These metrics notably do not include any data about the websites or domains you visit. To verify this, [search](https://github.com/lindylearn/unclutter/search?q=reportEvent) for code references of `reportEvent()` in this code base or where you downloaded the extension.

| 🐛     **Any concern with this? Please [open an issue](https://github.com/lindylearn/unclutter/issues/new) for it!** |
| -------------------------------------------------------------------------------------------------------------------- |
