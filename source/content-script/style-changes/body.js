// Perform various fixes to a site's body tag, to improve the page view display
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
    // set start properties for animation immediately
    document.body.style.width = "100%";
    // document.body.style.margin = "0";
    // document.body.style.maxWidth = "none";

    // set animation style inline to have out transition
    // easeOutExpo from easings.net
    document.body.style.transition = `margin-top 0.15s cubic-bezier(0.16, 1, 0.3, 1),
	margin-left 0.3s cubic-bezier(0.16, 1, 0.3, 1),
	width 0.3s cubic-bezier(0.16, 1, 0.3, 1)`;

    const bodyStyle = window.getComputedStyle(document.body);

    // add miniscule top padding if not already present, to prevent top margin collapse
    // note that body margin is rewritten into padding in cssTweaks.ts
    if (["", "0px"].includes(bodyStyle.paddingTop)) {
        document.body.style.paddingTop = "0.05px";
    }
    // add some minimal padding if none present (0 padding looks quite ugly)
    if (["", "0px"].includes(bodyStyle.paddingLeft)) {
        document.body.style.paddingLeft = "20px";
        document.body.style.paddingRight = "20px";
    }

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
    document.body.style.setProperty("height", "auto", "important");
    document.body.style.setProperty("margin", "10px auto", "important");
}

export function unModifyBodyStyle() {
    styleObserver.disconnect();

    document.body.style.setProperty("margin", "unset");
    document.body.style.setProperty("padding", "unset");
    document.body.style.setProperty("height", "unset");
}
