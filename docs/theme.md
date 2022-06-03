# Theme support

Unclutter supports changing the appearance of articles, including changing the font size, page width, and color scheme.

![](../source/../media/clips/theme.gif)

## Font customization

You can change the font size and page width of articles via the "Aa" icon in the top right of the article view. These theme settings apply to all websites.

## Dark mode

By default, dark mode activates automatically based on your OS system preference (either always dark or changing based on the time of day), or for websites that always use dark background colors. You can also manually switch the color theme via the theme popup.

This works by parsing the CSS styling of websites and replacing found background colors, darkening highlights like underlines, searching for text elements and setting their color to white, and applying alternative colors to the rest of the UI. See [theme.ts](https://github.com/lindylearn/unclutter/blob/main/source/content-script/modifications/CSSOM/theme.ts) for the code.

| 🐛     **Is this not working as expected or could be better? Please [open an issue](https://github.com/lindylearn/unclutter/issues/new) for it!** |
| ------------------------------------------------------------------------------------------------------------------------------------------------- |
