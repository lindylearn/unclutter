# Element blocking

Because of the wide range of website styling options, Unclutter will not work perfectly on every article.
There are two options for you to make the last 5% of articles more readable:

-   For various styling issues, please click the `Report page` button under the "bug" icon in top right of each page. The page will then get fixed within a few days.
-   You can immediately remove distracting page elements via the `Block element` button within the same tooltip.

Both options make the extension better for everyone! Reporting a page creates a [GitHub issue](https://github.com/lindylearn/unclutter/issues?q=is%3Aissue+is%3Aclosed+label%3Abroken-website) which I'll try to resolve, and blocking elements creates a [Pull-Request](https://github.com/lindylearn/unclutter/pulls?q=is%3Apr+label%3Abroken-website) with your created selectors.

## Element blocking details

After enabling the element blocking mode via the button in the "bug" popup, simply select the page elements you want to remove.

![](./media/clips/element-blocking.gif)

`Reset` undos all your changes, whereas `Save selectors` from then on applies them to all pages you visit on this website domain. You can exit the element blocking mode by clicking the `Report page` button again or pressing `Esc`.

Internally, Unclutter detects page elements you hover over and iterates up as far as possible in the document tree in [elementPicker.ts](https://github.com/lindylearn/unclutter/blob/main/source/content-script/modifications/elementPicker.ts). Once you click on an element the extension creates a CSS selector based on the element id or classname, and hides everything that matches this selector.

## What elements should be blocked

Ideally everything that isn't part of the article text, page title, metadata such as author name, or images / interactive components that accompany the main text.

Most often, the distractions left over from the automated uncluttering will be empty space, "related articles" sections, advertising interludes inside the text, or overly large site headers. Please feel free to block anything that distracts you from reading.
