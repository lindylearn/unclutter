# Page Outline

Unclutter tries to parse chapters from articles and lists them in the page outline to the left. The goal is to make navigating long pages easier.

The outline considers both explicit and implicit headings (["dropcap" sections](https://www.newyorker.com/magazine/2018/11/12/why-doctors-hate-their-computers) that start with captial letters), and fades-out the sections you already scrolled by. Click on any heading to jump to it. The outline just shows the article title if there are no detected headings for a page.

See [reading time](https://github.com/lindylearn/unclutter/blob/main/docs/reading-time.md) for the time displayed beneath the outline title.

The number of [social highlights](https://github.com/lindylearn/unclutter/blob/main/docs/social-highlights.md) or [privates notes](https://github.com/lindylearn/unclutter/blob/main/docs/annotations.md) will also appear next to outline headings if you enabled those features. The "progress ring" next to the title counts the number of private notes you made on the page to incentivize deeper reading (at least, that's the idea).

See [parse.ts](https://github.com/lindylearn/unclutter/blob/main/source/overlay/outline/parse.ts) for the parsing code and [Outline.svelte](https://github.com/lindylearn/unclutter/blob/main/source/overlay/outline/Outline.svelte) for the UI.

| 🐛     **Is this feature not working as expected or could be better? Just [open a short issue](https://github.com/lindylearn/unclutter/issues/new) for it!** |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
