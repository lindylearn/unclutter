// Perform various fixes to a site's body tag to improve the page view display
let styleObserver;
export function modifyBodyStyle() {
    _modifyBodyStyle();

    // re-run on <html> inline style changes (e.g. scroll-locks)
    styleObserver = new MutationObserver((mutations, observer) => {
        _modifyBodyStyle();
    });
    styleObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["style"],
    });
}

function _modifyBodyStyle() {
    const bodyStyle = window.getComputedStyle(document.body);

    // add miniscule top padding if not already present, to prevent top margin collapse
    // note that body margin is rewritten into padding in cssTweaks.ts
    if (["", "0px"].includes(bodyStyle.paddingTop)) {
        document.body.style.paddingTop = "0.05px";
    }
    document.body.style.paddingLeft = "40px";
    document.body.style.paddingRight = "40px";

    // html or body tags may have classes with fixed style applied (which we hide via css rewrite)
    document.documentElement.style.setProperty("display", "block", "important");
    document.body.style.setProperty("display", "block", "important");

    // set inline styles to overwrite scroll-locks
    document.documentElement.style.setProperty(
        "position",
        "relative",
        "important"
    );
    document.documentElement.style.setProperty(
        "overflow-y",
        "scroll",
        "important"
    );
    document.documentElement.style.setProperty("height", "auto", "important");
    document.body.style.setProperty("height", "auto", "important");
    document.body.style.setProperty("margin", "10px auto", "important");
}

export function unModifyBodyStyle() {
    styleObserver.disconnect();

    document.body.style.removeProperty("display");
    document.body.style.removeProperty("width");
    document.body.style.removeProperty("max-width");
    document.body.style.removeProperty("height");
    document.body.style.removeProperty("margin");
    document.body.style.removeProperty("padding");
    document.body.style.removeProperty("transition");
}
