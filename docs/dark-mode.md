# Dark Mode

Unclutter supports a dynamic dark mode theme for articles to make reading easier for your eyes at night.

Dark mode activates automatically based on your OS system preference (either always dark or changing based on the time of day), or for websites that use dark background colors by default. You can also manually activate the dark mode via the Unclutter theme settings (which applies to all websites and disables the automatic changes).

This works by parsing the CSS styling of websites and replacing found background colors, darkening highlights like underlines, searching for text elements and setting their color to white, and applying alternative colors to the rest of the UI.

See [theme.ts](https://github.com/lindylearn/unclutter/blob/main/source/content-script/modifications/CSSOM/theme.ts) for the code.

| 🐛     **Is this feature this not working as expected or could be better? Just [open a short issue](https://github.com/lindylearn/unclutter/issues/new) for it!** |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
