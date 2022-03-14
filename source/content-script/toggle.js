import browser from "webextension-polyfill";
import { insertContentBlockStyle } from "./pageview/contentBlock";
import { patchStylesheets } from "./pageview/patchStylesheets";
import {
    insertBackground,
    insertDomainToggle,
    modifyBodyStyle,
    unPatchDocumentStyle,
} from "./pageview/styleChanges";

// listen to togglePageView events sent from background script
browser.runtime.onMessage.addListener(async (event) => {
    if (event === "ping") {
        return true;
    } else if (event === "togglePageView") {
        const isPageView =
            document.documentElement.classList.contains("pageview");
        if (!isPageView) {
            // rewrite existing stylesheets
            patchStylesheets([...document.styleSheets]);

            enablePageView(() => {
                // when user exists page view
                // undo all modifications (including css rewrites and style changes)
                disableStyleChanges();
            });
            enableStyleChanges();
        } else {
            // hack: simulate click to call disable handlers with correct state
            document.documentElement.click();
        }
    }
});

export function enablePageView(disableHook = () => {}) {
    // base css is already injected, activate it by adding class
    // add to <html> element since <body> not contructed yet
    document.documentElement.classList.add("pageview");

    // ensure pageview class stays active (e.g. nytimes JS replaces classes)
    const htmlClassObserver = new MutationObserver((mutations, observer) => {
        if (!mutations[0].target.classList.contains("pageview")) {
            document.documentElement.classList.add("pageview");
        }
    });
    htmlClassObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
    });

    // allow exiting pageview by clicking on background surrounding pageview (bare <html>)
    document.documentElement.onclick = (event) => {
        if (event.target.tagName === "HTML") {
            htmlClassObserver.disconnect();
            disablePageView();
            disableHook();
        }
    };
}

export function disablePageView() {
    // disable page view exiting
    document.documentElement.onclick = null;

    // disable css style
    document.documentElement.classList.remove("pageview");

    // TODO remove inline tweaks
}

export async function enableStyleChanges() {
    insertBackground();
    insertContentBlockStyle();

    // patch after new style applied
    modifyBodyStyle();

    insertDomainToggle();
}
export async function disableStyleChanges() {
    await unPatchDocumentStyle();
}
