# Privacy policy

The Unclutter browser extension is provided for free and does not collect any personal information. No data at all is shared with third parties. **In particular, no information about the websites you visit leaves your local browser.**

## Website access

The Unclutter extension has the permission to "read and change all your data on websites that you visit" by default. This permission is used to locally check if a page is likely to be an article, and to automatically activate the reader mode or enable the AI highlights if you enabled those features.

In practice, [a small boot script](https://github.com/lindylearn/unclutter/blob/main/source/content-script/boot.ts) gets injected into your tabs and checks the site URL and amount of text content on each page against your settings.

**If you do not use the automatic activation or smart reading features you can simply revoke the "Site access" permission from the Unclutter extension settings.**

## Article library

Articles you open with Unclutter are automatically saved in your local browser to provide the "library" read-it-later features. Highlights you create are saved similarly.

You can optionally create an Unclutter library account to synchronize your data between devices and browsers. In that case your data is stored remotely but not accessible to any third parties.

## Highlights sync

If you enable the Hypothes.is [sync feature](./annotations.md), your highlights will be uploaded to the hypothes.is service and are subject to their [privacy policy](https://web.hypothes.is/privacy/).

## Smart Reading

If you enable the experimental "smart reading" AI features, the text for articles you read is sent to a remote cloud function in order to run large AI models on it.

This data is not stored, shared, or used for any purpose other than returning information about the article to the Unclutter browser extension.

## Social comments

The optional [social comments](./social-highlights.md) feature sends a network request to fetch highlights for articles you activate the reader mode on. This network request contains only the SHA256 one-way hash of the normalized page URL, containing no query parameters or user identification.

The number of social comments on the Unclutter extension icon works without network requests by periodically downloading a [static CSV](./social-highlights.md#privacy) file.

## Usage metrics

The extension reports technical usage metrics to understand which features work as expected, but these metrics never include personal information or specific information about the articles you read.

To verify this, [browse](https://github.com/lindylearn/unclutter/search?q=reportEvent) the code on Github or where you downloaded the extension files to. Unclutter is bundled in a way to be as readable as possible.

## Licence

This project uses [GNU AGPLv3](https://choosealicense.com/licenses/gpl-3.0/), which requires commercial projects that use it to be open-source as well. See [LICENCE](../LICENCE) for details.

| 🐛     **Any concern with this? Please [open an issue](https://github.com/lindylearn/unclutter/issues/new) for it!** |
| -------------------------------------------------------------------------------------------------------------------- |
