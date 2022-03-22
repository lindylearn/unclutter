# Automatically detecting and uncluttering articles

The goal of the automatic mode is to unclutter articles you've not provided explicit settings for. It's meant to be a sensible default that works for most people.

You can always explicitly disable or enable Unclutter on specific domains.

## Challenges

-   Activating the extension on non-articles is annoying (even if less so than for most reader modes)
-   For performance, the code that decides whether a web page is an article does not have access to the DOM (only the URL).
-   Not every web page on a domain is an article, even if some of them are. The extension should detect and not activate on "non-leaf" pages like bbc.com/news without excessive user configuration.

## Automatically detecting articles

The current logic to automatically detect articles (in the absence of an overriding website-specific setting) is as follows:

-   Never activate the extension on the domains listed in ([defaultStorage.js](https://github.com/lindylearn/unclutter/blob/main/source/common/defaultStorage.js)).
-   Otherwise active the extension if the current page passes the "non-leaf" check below.

## Detecting non-leaf pages

Unclutter will never activate on web pages that pass the following checks. This applies to both domains explicitly enabled by the user, and pages that pass the automatic article detection above.

-   Never activate on URLs at the root of a domain (/).
-   Never activate on URL paths that end with `.pdf`.

## Status

These checks are work in progress. Please create an issue if you found bugs or want to contribute!
