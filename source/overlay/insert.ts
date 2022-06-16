import { insertHtml } from "../common/html";
import browser from "../common/polyfill";
import {
    domainUserSetting,
    getUserSettingForDomain,
    setUserSettingsForDomain,
} from "../common/storage";
import { togglePageView } from "../content-script/enhance";
import { reportEventContentScript } from "../content-script/messaging";
import AnnotationsModifier from "../content-script/modifications/annotations/annotationsModifier";
import ThemeModifier from "../content-script/modifications/CSSOM/theme";
import OverlayManager from "../content-script/modifications/overlay";

const githubLink = `https://github.com/lindylearn/unclutter/issues`;

// Insert a small UI for the user to control the automatic pageview enablement on the current domain.
// Creating an iframe for this doesn't work from injected scripts
export function insertPageSettings(
    domain: string,
    themeModifier: ThemeModifier,
    annotationsModifer: AnnotationsModifier,
    overlayModifier: OverlayManager
) {
    insertHtml(
        "lindy-page-settings-pageadjacent",
        `<div id="lindy-domain-switch-icon-container" class="lindy-tooltp lindy-tooltp-reverse lindy-fade">
            <!-- <svg> inserted in _setupDomainToggleState() below  -->
        </div>`
    );

    // the getElementById() cause repeated reflows here -- maybe batch

    _setupDomainToggleState(domain);
    _setupThemePopupHandlers(domain, themeModifier);
}

// *** Domain automatic activation toggle ***
let currentUserSetting = null;
async function _setupDomainToggleState(currentDomain: string) {
    const svg = document.getElementById("lindy-domain-switch-icon-container");
    currentUserSetting = await getUserSettingForDomain(currentDomain);
    svg.innerHTML = _getDomainToggleIcon(currentUserSetting);
    svg.setAttribute(
        "data-title",
        _getDomainToggleTooltip(currentUserSetting, currentDomain)
    );

    svg.onclick = (e) => {
        currentUserSetting = _nextUserSetting(currentUserSetting);
        renderActiveUserSetting(currentDomain);

        if (currentUserSetting === "allow") {
            wiggleDomainState();
        } else {
            // ensure wiggle animation does not play
            svg.classList.remove("lindy-domain-switch-wiggle");
        }

        reportEventContentScript("changeDomainSetting", {
            newState: currentUserSetting,
            trigger: "icon",
        });
    };
}
function renderActiveUserSetting(currentDomain: string) {
    const svg = document.getElementById("lindy-domain-switch-icon-container");
    svg.innerHTML = _getDomainToggleIcon(currentUserSetting);
    svg.setAttribute(
        "data-title",
        _getDomainToggleTooltip(currentUserSetting, currentDomain)
    );

    setUserSettingsForDomain(currentDomain, currentUserSetting);

    // convenience: also disable pageview if automatic status disabled
    if (currentUserSetting === "deny") {
        // ideally send a message here -- but can't access current tab id in this context
        // leave some time for the user to see the new state icon
        setTimeout(togglePageView, 300);

        browser.runtime.sendMessage(null, {
            event: "disabledPageView",
            trigger: "blocklistDomain",
            pageHeightPx: document.body.clientHeight,
        });
    }
}
function _nextUserSetting(userSetting: domainUserSetting): domainUserSetting {
    if (userSetting === "allow") {
        return "deny";
    } else if (userSetting === "deny") {
        return "allow";
    } else {
        return "allow";
    }
}
function _getDomainToggleTooltip(
    userSetting: domainUserSetting,
    domain: string
): string {
    if (userSetting === "allow") {
        return `Enabled on ${domain}`;
    } else if (userSetting === "deny") {
        return `Disabled on ${domain}`;
    } else {
        return `Click to automatically unclutter ${domain}`;
    }
}
function _getDomainToggleIcon(userSetting: domainUserSetting): string {
    if (userSetting === "allow") {
        return `
        <svg class="lindy-ui-icon" id="lindy-domain-switch-icon" viewBox="0 0 512 512">
            <path fill="currentColor" d="M289.7 .0006C308.8 .0006 322.6 18.26 317.4 36.61L263.8 224H349.1C368.4 224 384 239.6 384 258.9C384 269.2 379.5 278.9 371.7 285.6L112.9 505.2C107.7 509.6 101.1 512 94.27 512C75.18 512 61.4 493.7 66.64 475.4L120.2 288H33.74C15.1 288 0 272.9 0 254.3C0 244.4 4.315 235 11.81 228.6L271.1 6.893C276.3 2.445 282.9 0 289.7 0V.0006zM253.6 84.99L72.36 240H152C159.5 240 166.6 243.5 171.2 249.5C175.7 255.6 177.1 263.4 175.1 270.6L130.3 427.5L313.5 272H232C224.5 272 217.4 268.5 212.8 262.5C208.3 256.4 206.9 248.6 208.9 241.4L253.6 84.99z" />
        </svg>`;
    } else if (userSetting === "deny") {
        return `
        <svg class="lindy-ui-icon" id="lindy-domain-switch-icon" viewBox="0 0 512 512" style="overflow: visible; margin-left: -5px; margin-right: 5px;">
            <path fill="currentColor" d="M227.9 153.3L399.1 6.894C404.3 2.445 410.9 .0003 417.7 .0003C436.8 .0003 450.6 18.26 445.4 36.61L391.8 224H477.1C496.4 224 512 239.6 512 258.9C512 269.2 507.5 278.9 499.7 285.6L450.2 327.6L630.8 469.1C641.2 477.3 643.1 492.4 634.9 502.8C626.7 513.2 611.6 515.1 601.2 506.9L9.196 42.89C-1.236 34.71-3.065 19.63 5.112 9.196C13.29-1.236 28.37-3.065 38.81 5.112L227.9 153.3zM266.4 183.5L337.5 239.3L381.6 84.99L266.4 183.5zM379.3 272L411.6 297.3L441.5 272H379.3zM336.5 361.1L374.9 391.4L240.9 505.2C235.7 509.6 229.1 512 222.3 512C203.2 512 189.4 493.7 194.6 475.4L247.4 290.9L288.1 322.1L258.3 427.5L336.5 361.1zM153.5 216.9L243.7 288H161.7C143.1 288 128 272.9 128 254.3C128 244.4 132.3 235 139.8 228.6L153.5 216.9z" />
        </svg>`;
    } else {
        return `
        <svg class="lindy-ui-icon" id="lindy-domain-switch-icon" viewBox="0 0 512 512" style="overflow: visible;">
            <path fill="currentColor" d="M263.8 224H349.1C368.4 224 384 239.6 384 258.9C384 269.2 379.5 278.9 371.7 285.6L112.9 505.2C107.7 509.6 101.1 512 94.27 512C75.18 512 61.4 493.7 66.64 475.4L120.2 288H33.74C15.1 288 0 272.9 0 254.3C0 244.4 4.315 235 11.81 228.6L271.1 6.893C276.3 2.445 282.9 0 289.7 0C308.8 0 322.6 18.26 317.4 36.61L263.8 224zM152 240C159.5 240 166.6 243.5 171.2 249.5C175.7 255.6 177.1 263.4 175.1 270.6L130.3 427.5L313.5 272H232C224.5 272 217.4 268.5 212.8 262.5C208.3 256.4 206.9 248.6 208.9 241.4L253.6 84.99L72.36 240H152zM464 288C473.1 288 481.4 293.1 485.5 301.3L573.5 477.3C579.4 489.1 574.6 503.5 562.7 509.5C550.9 515.4 536.5 510.6 530.5 498.7L517.2 472H410.8L397.5 498.7C391.5 510.6 377.1 515.4 365.3 509.5C353.4 503.5 348.6 489.1 354.5 477.3L442.5 301.3C446.6 293.1 454.9 288 464 288H464zM434.8 424H493.2L464 365.7L434.8 424z" />
        </svg>`;
    }
}
export function wiggleDomainState(delayMs: number = 0) {
    setTimeout(() => {
        const container = document.getElementById(
            "lindy-domain-switch-icon-container"
        );

        // remove class first in case called by automatic activation already
        container.classList.remove("lindy-domain-switch-wiggle");
        container.classList.add("lindy-domain-switch-wiggle");
    }, delayMs);
}
export function updateDomainState(
    newUserSetting: domainUserSetting,
    currentDomain: string
) {
    currentUserSetting = newUserSetting;
    renderActiveUserSetting(currentDomain);
}
