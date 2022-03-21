// Enable the "page view" on a webpage, which restricts the rendered content to a fraction of the browser window.
export async function enablePageView(
    disableHook = () => {},
    enableAnimation = false
) {
    if (enableAnimation && document.body) {
        _enableAnimation();
        // wait until next execution loop so animation works
        await new Promise((r) => setTimeout(r, 0));
    }

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
    document.documentElement.addEventListener(
        "click",
        async (event) => {
            if (event.target.tagName === "HTML") {
                htmlClassObserver.disconnect();

                // make sure the animation is enabled
                _enableAnimation();
                await new Promise((r) => setTimeout(r, 0));

                // disable page view exiting
                document.documentElement.onclick = null;
                // disable css style
                document.documentElement.classList.remove("pageview");

                disableHook();
            }
        },
        true
    );
}

function _enableAnimation() {
    // set start properties for animation immediately
    // document.body.style.margin = "0";
    document.body.style.width = "100%";
    document.body.style.maxWidth = "100%";

    // set animation style inline to have out transition
    // easeOutExpo from easings.net
    document.body.style.transition = `
        margin-top 0.15s cubic-bezier(0.16, 1, 0.3, 1),
        margin-left 0.3s cubic-bezier(0.16, 1, 0.3, 1),
        max-width  0.3s cubic-bezier(0.16, 1, 0.3, 1)
    `;
}
