import { iterateCSSOM } from "../style-changes/iterateCSSOM";

// listen to new stylesheet dom nodes, and start their patch process immediately
export function patchStylesheetsOnceCreated() {
    const seenStylesheets = new Set();
    const observer = new MutationObserver(async (mutations, observer) => {
        if (document.head) {
            observer.disconnect();

            const [hideNoise, enableResponsiveStyle, restoreOriginalStyle] =
                await iterateCSSOM();
            hideNoise();
            enableResponsiveStyle();
        }

        // mutations.map((mutation) => {
        //     if (mutation.target.tagName !== "HEAD") {
        //         return;
        //     }
        //     const element = mutation.addedNodes?.[0];
        //     console.log(element?.tagName);
        //     if (element?.tagName !== "LINK") {
        //         return;
        //     }

        //     // console.log([...document.styleSheets].map((sheet) => sheet.href));
        // });

        // const stylesheets = [...document.styleSheets];

        // const newStylesheets = stylesheets.filter(
        //     (sheet) => !seenStylesheets.has(sheet)
        // );
        // newStylesheets.map((sheet) => seenStylesheets.add(sheet));

        // patchStylesheets(newStylesheets);
    });
    observer.observe(document, { childList: true, subtree: true });
    // executing site JS may add style elements, e.g. cookie banners
    // so continue listening for new stylesheets
    return () => observer.disconnect();
}

// patch a set of stylesheet elements
export async function patchStylesheets(newStylesheets) {
    console.log(newStylesheets);
    // const newStylesheetsToPatch = newStylesheets
    //     .map((sheet) => sheet.ownerNode)
    //     .filter(
    //         (node) =>
    //             node &&
    //             !node.classList.contains(overrideClassname) &&
    //             !node.classList.contains(disabledClassname)
    //     );
    // const conditionScale = window.innerWidth / 750;
    // await Promise.all(
    //     newStylesheetsToPatch.map((node) =>
    //         patchStylesheetNode(node, conditionScale)
    //     )
    // );
}
