# Reading time

Unclutter shows the reading time of articles beneath the title on the [outline](https://github.com/lindylearn/unclutter/blob/main/docs/outline.md), and updates it as you read. This is meant to be an unobtrusive indicator of the length of articles.

Right now this works very simply by calculating the number of words shown on the entire article page (after uncluttering it), and assuming a reading speed of 200WPM. The fraction of the page you already scrolled by is subtracted from the total reading time.

This is implemented in [readingTime.ts](https://github.com/lindylearn/unclutter/blob/main/source/content-script/modifications/DOM/readingTime.ts).

| 🐛     **Is this feature this not working as expected or could be better? Just [open a short issue](https://github.com/lindylearn/unclutter/issues/new) for it!** |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
