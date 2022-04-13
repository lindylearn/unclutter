import { PageModifier, trackModifierExecution } from "./_interface";

// Perform various inline style fixes to overwrite site styles
@trackModifierExecution
export default class BodyStyleModifier implements PageModifier {
    private styleObserver: MutationObserver;

    transitionIn() {
        this.modifyHtmlStyle();
        this.modifyBodyStyle();

        // re-run on <html> inline style changes (e.g. scroll-locks)
        this.styleObserver = new MutationObserver((mutations, observer) => {
            this.modifyHtmlStyle();
        });
        this.styleObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["style"],
        });
    }

    async afterTransitionOut() {
        this.styleObserver.disconnect();

        document.body.style.removeProperty("display");
        document.body.style.removeProperty("width");
        document.body.style.removeProperty("min-width");
        document.body.style.removeProperty("max-width");
        document.body.style.removeProperty("height");
        document.body.style.removeProperty("margin");
        document.body.style.removeProperty("padding");
        document.body.style.removeProperty("background");
        document.body.style.removeProperty("transition");
    }

    private modifyHtmlStyle() {
        // html or body tags may have classes with fixed style applied (which we hide via css rewrite)
        document.documentElement.style.setProperty(
            "display",
            "block",
            "important"
        );

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
        document.documentElement.style.setProperty(
            "height",
            "auto",
            "important"
        );
    }

    private modifyBodyStyle() {
        const bodyStyle = window.getComputedStyle(document.body);

        // add miniscule top padding if not already present, to prevent top margin collapse
        // note that body margin is rewritten into padding in cssTweaks.ts
        if (["", "0px"].includes(bodyStyle.paddingTop)) {
            document.body.style.paddingTop = "0.05px";
        }
        document.body.style.setProperty("padding-left", "50px", "important");
        document.body.style.setProperty("padding-right", "50px", "important");
        document.body.style.setProperty("min-width", "0", "important");
        document.body.style.setProperty(
            "max-width",
            "var(--lindy-pagewidth)",
            "important"
        );

        document.body.style.setProperty("display", "block", "important");

        document.body.style.setProperty("height", "auto", "important");
        document.body.style.setProperty(
            "margin",
            "10px auto 40px auto",
            "important"
        );
    }
}
