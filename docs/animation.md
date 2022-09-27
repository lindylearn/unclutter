# Unclutter Animation

Unclutter animates the page changes it performs when you activate it:

![](./media/clips/distractions.gif)

This works by carefully ordering the fade-out of noisy elements, parsing of website text, transition into the final position, and other feature activations into multiple animation phases in [transitions.ts](https://github.com/lindylearn/unclutter/blob/main/source/content-script/modifications/CSSOM/theme.ts). Plus a few other tricks.

Admittedly, it doesn't always as nice as the above video depending on how much JS and CSS a website runs, and on your system load. Please let me know if you find some particularly bad examples.

| 🐛     **Is this not working as expected or could be better? Please [open an issue](https://github.com/lindylearn/unclutter/issues/new) for it!** |
| ------------------------------------------------------------------------------------------------------------------------------------------------- |
