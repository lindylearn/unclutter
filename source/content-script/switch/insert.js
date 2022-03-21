import browser from "../../common/polyfill";
import {
    getUserSettingForDomain,
    setAutomaticStatusForDomain,
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

    const githubLink = `https://github.com/lindylearn/unclutter/issues/new?labels=broken-website&title=${encodeURIComponent(
        `Article doesn't show correctly on ${domain}`
    )}&body=${encodeURIComponent(
        `The following article doesn't appear correctly in Unclutter. Please take a look!\n\n${window.location.href}`
    )}`;

    const html = `
        <img id="lindy-settings-icon" src="${browser.runtime.getURL(
            "assets/icons/settings.svg"
        )}"></img>
        <a href="${githubLink}" target="_blank" rel="noopener noreferrer">
            <img id="lindy-bug-icon" src="${browser.runtime.getURL(
                "assets/icons/bug.svg"
            )}"></img>
        </a>
    `;
    const container = document.createElement("div");
    container.className = `${overrideClassname} lindy-page-settings-topright`;
    container.innerHTML = html;
    document.documentElement.appendChild(container);

    const html2 = `
        <div class="lindy-domain-switch-icon">
            <img id="lindy-domain-switch-icon"></img>
        </div>
    `;
    const container2 = document.createElement("div");
    container2.className = `${overrideClassname} lindy-page-settings-pageadjacent`;
    container2.innerHTML = html2;
    document.documentElement.appendChild(container2);

    createStylesheetLink(
        browser.runtime.getURL("content-script/switch/index.css")
    );

    _setupDomainToggleState(domain);
    _setupLinkHandlers();
}

async function _setupDomainToggleState(currentDomain) {
    const svg = document.getElementById("lindy-domain-switch-icon");
    let userSetting = await getUserSettingForDomain(currentDomain);
    svg.src = _getDomainToggleIcon(userSetting);

    svg.onclick = (e) => {
        userSetting = _nextUserSetting(userSetting);
        svg.src = _getDomainToggleIcon(userSetting);
        setAutomaticStatusForDomain(currentDomain, userSetting === "allow");

        // convenience: also disable pageview if automatic status disabled
        if (userSetting === "deny") {
            // ideally send a message here -- but can't access current tab id in this context
            // leave some time for the user to see the new state icon
            setTimeout(togglePageView, 100);
        }
    };
}
function _nextUserSetting(userSetting) {
    if (userSetting === "allow") {
        return "deny";
    } else if (userSetting === "deny") {
        return "allow";
    } else {
        return "deny";
    }
}
function _getDomainToggleIcon(userSetting) {
    if (userSetting === "allow") {
        return browser.runtime.getURL("assets/icons/bolt.svg");
    } else if (userSetting === "deny") {
        return browser.runtime.getURL("assets/icons/bolt-slash.svg");
    } else {
        return browser.runtime.getURL("assets/icons/bolt-auto.svg");
    }
}

export function _setupLinkHandlers() {
    const settings = document.getElementById("lindy-settings-icon");
    settings.onclick = () =>
        chrome.runtime.sendMessage({ event: "openOptionsPage" });
}
