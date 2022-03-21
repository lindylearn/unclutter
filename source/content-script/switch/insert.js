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

export default function insert() {
    insertPageSettings();
}

// Insert a small UI for the user to control the automatic pageview enablement on the current domain.
// Creating an iframe for this doesn't work from injected scripts
function insertPageSettings() {
    const url = new URL(window.location.href);
    const domain = url.hostname.replace("www.", "");

    const html = `
        <div class="lindy-domain-switch">
            <div class="lindy-switch">
                <input type="checkbox" id="lindy-domain-switch-input"/>
                <label for="lindy-domain-switch-input"></label>
            </div>
            <span>Unclutter <span id="domain">${domain}</span></span>
        </div>
        <img id="lindy-settings-icon" src="${browser.runtime.getURL(
            "assets/icons/settings.svg"
        )}"></img>
        <img id="lindy-bug-icon" src="${browser.runtime.getURL(
            "assets/icons/bug.svg"
        )}"></img>
    `;

    const container = document.createElement("div");
    container.className = `${overrideClassname} lindy-page-settings`;
    container.innerHTML = html;
    document.documentElement.appendChild(container);

    createStylesheetLink(
        browser.runtime.getURL("content-script/switch/index.css")
    );

    // _setupDomainToggleHandler(domain);
    _setupLinkHandlers();
}

async function _setupDomainToggleHandler(currentDomain) {
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

export function _setupLinkHandlers() {
    const settings = document.getElementById("lindy-settings-icon");
    settings.onclick = () =>
        chrome.runtime.sendMessage({ event: "openOptionsPage" });

    const bug = document.getElementById("lindy-bug-icon");
    bug.onclick = () =>
        chrome.runtime.sendMessage({ event: "openOptionsPage" });
}
