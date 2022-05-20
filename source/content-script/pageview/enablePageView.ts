// Enable the "page view" on a webpage, which restricts the rendered content to a fraction of the browser window.
export async function enablePageView(): Promise<() => void> {
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

    // cleanup on pageview disable
    async function disablePageView() {
        htmlClassObserver.disconnect();

        // pageview class should be removed in disableHook
    }

    return disablePageView;
}

// should be called at least ~100ms before enabling pageview, otherwise seems not to trigger sometimes
export function preparePageviewAnimation() {
    if (!document.body) {
        return;
    }

    // set animation style inline to have out transition
    // adding padding seems to not work
    // use easeOutExpo
    document.body.style.transition = `
        margin 1s cubic-bezier(0.87, 0, 0.13, 1),
        width  1s cubic-bezier(0.87, 0, 0.13, 1),
        max-width  1s cubic-bezier(0.87, 0, 0.13, 1)
    `;

    // set start properties for animation immediately
    // document.body.style.margin = "0";
    document.body.style.width = "100%";
    document.body.style.maxWidth = "100%";

    // wait until next execution loop so animation works
    // await new Promise((r) => setTimeout(r, 0));
}
