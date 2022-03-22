# Anonymous metrics collection

By default this extension collects some anonymous usage metrics, in order to understand how people use it. These metrics notably do not include any identifying information or any data about the sites and domains you visit.

This is a first draft, please raise an issue here if you have a problem with any of this!

## Goal

The goal of collecting usage metrics is to understand how the extension is used and how to make it better. Hopefully it answers the following questions:

-   How many people who download the extension actually use it? This correllates with my motivation to improve it further.
-   Is the [automatic mode](https://github.com/lindylearn/unclutter/blob/main/docs/article-detection.md) working as expected? How many people choose to activate it versus configuring a custom list of domains?
-   Are some features actually used, like the website-specific configurations?

## Collected data

All metrics are reported to the privacy-friendly [plausible.io](https://plausible.io/) reporting tool, containing no identifying information other than your browser user agent string. The events never contain any data about the pages or domains you visit.

The following events are logged:

-   How often the extension is activated and deactivated on articles, and what triggered the activation (manual icon click, allowlisted domain, or automatic mode).
-   How many domains you configured the extension to activate or never activate on, and how often this is changed. The domains itself are never logged.
-   Whether settings like automatic mode or the metrics collection are enabled.

To verify this, [search for all references](https://github.com/lindylearn/unclutter/search?q=reportEvent) of `reportEvent()` in this code base or where you downloaded the extension. The released code is bundled in a way to be as readable as possible.
