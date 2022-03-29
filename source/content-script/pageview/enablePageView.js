// Enable the "page view" on a webpage, which restricts the rendered content to a fraction of the browser window.
export async function enablePageView(
    disableHook = () => {},
    enableAnimation = false
) {
    await _enableAnimation(enableAnimation);

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
    async function clickListener(event) {
        if (event.target.tagName === "HTML") {
            htmlClassObserver.disconnect();

            // make sure the animation is enabled
            _enableAnimation(true);
            await new Promise((r) => setTimeout(r, 0));

            // disable page view exiting
            document.documentElement.onclick = null;
            // unsubscribe this handler to prevent future duplicate even handling
            document.documentElement.removeEventListener(
                "click",
                clickListener,
                true
            );

            // pageview class should be removed in disableHook
            disableHook();
        }
    }
    document.documentElement.addEventListener("click", clickListener, true);
}

async function _enableAnimation(activateNow = false) {
    if (!document.body) {
        return;
    }

    // set animation style inline to have out transition
    // easeOutExpo from easings.net
    document.body.style.transition = `
        margin 0.2s cubic-bezier(0.16, 1, 0.3, 1),
        padding 0.2s cubic-bezier(0.16, 1, 0.3, 1s,
        width  0.2s cubic-bezier(0.16, 1, 0.3, 1),
        max-width  0.2s cubic-bezier(0.16, 1, 0.3, 1)
    `;

    if (activateNow) {
        // set start properties for animation immediately
        // document.body.style.margin = "0";
        document.body.style.width = "100%";
        document.body.style.maxWidth = "100%";

        // wait until next execution loop so animation works
        await new Promise((r) => setTimeout(r, 0));
    }
}
