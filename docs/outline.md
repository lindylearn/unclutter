# Page Outline

Unclutter parses articles chapters and lists them in the interactive page outline.

![](./media/clips/outline.gif)

## Outline headings

The outline considers both explicit and implicit headings (["dropcap" sections](https://www.newyorker.com/magazine/2018/11/12/why-doctors-hate-their-computers) that start with captial letters), and fades-out the sections you already scrolled by. Click on any heading to jump to it. The outline shows only the article title if there are no detected headings for a page.

See [parse.ts](https://github.com/lindylearn/unclutter/blob/main/source/overlay/outline/parse.ts) for the parsing code and [Outline.svelte](https://github.com/lindylearn/unclutter/blob/main/source/overlay/outline/Outline.svelte) for the UI.

## Reading time

Unclutter shows the reading time of articles beneath the title on the outline, and updates it as you read. This is meant to be an unobtrusive indicator of the length of articles.

Right now this works very simply by calculating the number of words shown on the entire article page (after uncluttering it), and assuming a reading speed of 200WPM. The fraction of the page you already scrolled by is subtracted from the total reading time.

This is implemented in [readingTime.ts](https://github.com/lindylearn/unclutter/blob/main/source/content-script/modifications/DOM/readingTime.ts).

## Social Comments & Highlights

The number of [social comments](https://github.com/lindylearn/unclutter/blob/main/docs/social-highlights.md) or [privates notes](https://github.com/lindylearn/unclutter/blob/main/docs/annotations.md) will also appear next to outline headings if you enabled those features. The "progress ring" next to the title counts the number of highlights you made on the page to incentivize deeper reading (at least, that's the idea).

| 🐛     **Is this not working as expected or could be better? Please [open an issue](https://github.com/lindylearn/unclutter/issues/new) for it!** |
| ------------------------------------------------------------------------------------------------------------------------------------------------- |
