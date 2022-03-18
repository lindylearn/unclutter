import browser from "../../common/polyfill";
import {
    setAutomaticStatusForDomain,
    shouldEnableForDomain,
} from "../../common/storage";
import { togglePageView } from "../enhance";
import {
    createStylesheetLink,
    overrideClassname,
} from "../style-changes/common";

// Insert a small UI for the user to control the automatic pageview enablement on the current domain.
// Creating an iframe for this doesn't work from injected scripts
export function insertDomainToggle() {
    const url = new URL(window.location.href);
    const domain = url.hostname.replace("www.", "");

    const html = `
    <span>Unclutter <span id="domain">${domain}</span></span>
    <div class="lindy-switch">
        <input type="checkbox" id="lindy-domain-switch-input"/>
        <label for="lindy-domain-switch-input"></label>
    </div>
    `;

    const container = document.createElement("div");
    container.className = `${overrideClassname} lindy-domain-switch`;
    container.innerHTML = html;
    document.documentElement.appendChild(container);

    createStylesheetLink(
        browser.runtime.getURL("content-script/switch/index.css")
    );

    setupHandler(domain);
}

async function setupHandler(currentDomain) {
    const switch1 = document.getElementById("lindy-domain-switch-input");
    switch1.checked = await shouldEnableForDomain(currentDomain);

    switch1.onclick = (e) => {
        const newState = e.target.checked;
        setAutomaticStatusForDomain(currentDomain, newState);

        // convenience: also disable pageview if automatic status disabled
        if (!newState) {
            // ideally send a message here -- but can't access current tab id in this context
            togglePageView();
        }
    };
}
