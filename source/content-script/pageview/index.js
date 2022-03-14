import { insertContentBlockStyle } from "./contentBlock";
import { unPatchStylesheets } from "./patchStylesheets";
import {
    insertBackground,
    insertDomainToggle,
    modifyBodyStyle,
    overrideClassname,
} from "./styleChanges";

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

            // disable page view exiting
            document.documentElement.onclick = null;
            // disable css style
            document.documentElement.classList.remove("pageview");

            disableHook();
        }
    };
}

export async function enableStyleChanges() {
    insertBackground();
    insertContentBlockStyle();

    // patch after new style applied
    modifyBodyStyle();

    insertDomainToggle();
}
export async function disableStyleChanges() {
    // restore original styles first
    unPatchStylesheets();

    // remove most modifications
    document
        .querySelectorAll(`.${overrideClassname}`)
        .forEach((e) => e.remove());
}
