// Enable the "page view" on a webpage, which restricts the rendered content to a fraction of the browser window.
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
    document.documentElement.addEventListener(
        "click",
        (event) => {
            if (event.target.tagName === "HTML") {
                htmlClassObserver.disconnect();

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
