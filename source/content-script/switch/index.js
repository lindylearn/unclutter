import browser from "../../common/polyfill";
import {
    setAutomaticStatusForDomain,
    shouldEnableForDomain,
} from "../../common/storage";

// Allow the user control the automatic extension enablement on the current domain.
// This is injected as an iframe into enabled tabs from `styleChanges.js`.
async function main() {
    const currentDomain = new URLSearchParams(document.location.search).get(
        "domain"
    );
    document.getElementById(
        "text"
    ).title = `Automatically unclutter pages from ${currentDomain}`;

    const switch1 = document.getElementById("switch1");
    switch1.checked = await shouldEnableForDomain(currentDomain);
    switch1.onclick = (e) => {
        const newState = e.target.checked;
        setAutomaticStatusForDomain(currentDomain, newState);

        // convenience: also disable pageview if automatic status disabled
        if (!newState) {
            browser.tabs
                .query({
                    active: true,
                    currentWindow: true,
                })
                .then((tabs) => {
                    browser.runtime.sendMessage(null, {
                        event: "disablePageView",
                        tabId: tabs[0].id,
                    });
                });
        }
    };

    document.body.style.visibility = "visible";
}
main();
