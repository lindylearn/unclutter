// Enable the "page view" on a webpage, which restricts the rendered content to a fraction of the browser window.
export function enablePageView(): () => void {
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
