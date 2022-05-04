import {
    getFeatureFlag,
    showSocialAnnotationsDefaultFeatureFlag,
    supportSocialAnnotations,
} from "../common/featureFlags";
import { insertHtml } from "../common/html";
import browser from "../common/polyfill";
import {
    domainUserSetting,
    getUserSettingForDomain,
    getUserTheme,
    setUserSettingsForDomain,
} from "../common/storage";
import { createStylesheetLink } from "../common/stylesheets";
import {
    applySaveThemeOverride,
    fontSizeThemeVariable,
    getThemeValue,
    pageWidthThemeVariable,
    themeName,
} from "../common/theme";
import { togglePageView } from "../content-script/enhance";
import {
    getRemoteFeatureFlag,
    reportEventContentScript,
} from "../content-script/messaging";
import AnnotationsModifier from "../content-script/modifications/annotations/annotationsModifier";
import ThemeModifier from "../content-script/modifications/CSSOM/theme";

// Insert a small UI for the user to control the automatic pageview enablement on the current domain.
// Creating an iframe for this doesn't work from injected scripts
export function insertPageSettings(
    domain: string,
    themeModifier: ThemeModifier,
    annotationsModifer: AnnotationsModifier
) {
    const githubLink = `https://github.com/lindylearn/unclutter/issues`;

    insertHtml(
        "lindy-page-settings-topright",
        `<div class="lindy-tooltip lindy-fade" data-title="Unclutter settings">
            <svg class="lindy-ui-icon" id="lindy-settings-icon" viewBox="0 0 512 512">
                <path fill="currentColor" d="M160 256C160 202.1 202.1 160 256 160C309 160 352 202.1 352 256C352 309 309 352 256 352C202.1 352 160 309 160 256zM256 208C229.5 208 208 229.5 208 256C208 282.5 229.5 304 256 304C282.5 304 304 282.5 304 256C304 229.5 282.5 208 256 208zM293.1 .0003C315.3 .0003 334.6 15.19 339.8 36.74L347.6 69.21C356.1 73.36 364.2 78.07 371.9 83.28L404 73.83C425.3 67.56 448.1 76.67 459.2 95.87L496.3 160.1C507.3 179.3 503.8 203.6 487.8 218.9L463.5 241.1C463.8 246.6 464 251.3 464 256C464 260.7 463.8 265.4 463.5 270L487.8 293.1C503.8 308.4 507.3 332.7 496.3 351.9L459.2 416.1C448.1 435.3 425.3 444.4 404 438.2L371.9 428.7C364.2 433.9 356.1 438.6 347.6 442.8L339.8 475.3C334.6 496.8 315.3 512 293.1 512H218.9C196.7 512 177.4 496.8 172.2 475.3L164.4 442.8C155.9 438.6 147.8 433.9 140.1 428.7L107.1 438.2C86.73 444.4 63.94 435.3 52.85 416.1L15.75 351.9C4.66 332.7 8.168 308.4 24.23 293.1L48.47 270C48.16 265.4 48 260.7 48 255.1C48 251.3 48.16 246.6 48.47 241.1L24.23 218.9C8.167 203.6 4.66 179.3 15.75 160.1L52.85 95.87C63.94 76.67 86.73 67.56 107.1 73.83L140.1 83.28C147.8 78.07 155.9 73.36 164.4 69.21L172.2 36.74C177.4 15.18 196.7 0 218.9 0L293.1 .0003zM205.5 103.6L194.3 108.3C181.6 113.6 169.8 120.5 159.1 128.7L149.4 136.1L94.42 119.9L57.31 184.1L98.81 223.6L97.28 235.6C96.44 242.3 96 249.1 96 256C96 262.9 96.44 269.7 97.28 276.4L98.81 288.4L57.32 327.9L94.42 392.1L149.4 375.9L159.1 383.3C169.8 391.5 181.6 398.4 194.3 403.7L205.5 408.4L218.9 464H293.1L306.5 408.4L317.7 403.7C330.4 398.4 342.2 391.5 352.9 383.3L362.6 375.9L417.6 392.1L454.7 327.9L413.2 288.4L414.7 276.4C415.6 269.7 416 262.9 416 256C416 249.1 415.6 242.3 414.7 235.6L413.2 223.6L454.7 184.1L417.6 119.9L362.6 136.1L352.9 128.7C342.2 120.5 330.4 113.6 317.7 108.3L306.5 103.6L293.1 48H218.9L205.5 103.6z" />
            </svg>
        </div>
        <a href="${githubLink}" target="_blank" rel="noopener noreferrer" class="lindy-tooltip lindy-fade" data-title="Report bug">
            <svg class="lindy-ui-icon" id="lindy-bug-icon" viewBox="0 0 512 512">
                <path fill="currentColor" d="M352 96V99.56C352 115.3 339.3 128 323.6 128H188.4C172.7 128 160 115.3 160 99.56V96C160 42.98 202.1 0 256 0C309 0 352 42.98 352 96zM39.03 103C48.4 93.66 63.6 93.66 72.97 103L145.4 175.5C161.3 165.7 179.1 160 200 160H312C332 160 350.7 165.7 366.6 175.5L439 103C448.4 93.66 463.6 93.66 472.1 103C482.3 112.4 482.3 127.6 472.1 136.1L400.5 209.4C410.3 225.3 416 243.1 416 264H488C501.3 264 512 274.7 512 288C512 301.3 501.3 312 488 312H416V320C416 347.2 409.2 372.8 397.2 395.3L472.1 471C482.3 480.4 482.3 495.6 472.1 504.1C463.6 514.3 448.4 514.3 439 504.1L368.2 434.1C339.3 462.5 299.7 480 256 480C212.3 480 172.7 462.5 143.8 434.1L72.97 504.1C63.6 514.3 48.4 514.3 39.03 504.1C29.66 495.6 29.66 480.4 39.03 471L114.8 395.3C102.8 372.8 96 347.2 96 320V312H24C10.75 312 0 301.3 0 288C0 274.7 10.75 264 24 264H96C96 243.1 101.7 225.3 111.5 209.4L39.03 136.1C29.66 127.6 29.66 112.4 39.03 103V103zM144 320C144 373.6 181.7 418.4 232 429.4V280C232 266.7 242.7 256 256 256C269.3 256 280 266.7 280 280V429.4C330.3 418.4 368 373.6 368 320V264C368 233.1 342.9 208 312 208H200C169.1 208 144 233.1 144 264V320z" />
            </svg>
        </a>
        <div class="lindy-theme-popup-container" data-title="Article theme">
            <svg class="lindy-ui-icon" id="lindy-theme-icon" viewBox="0 0 640 512">
                <path fill="currentColor" d="M198.4 47.47c-7.094-18.62-37.78-18.62-44.88 0l-152 400c-4.703 12.41 1.516 26.25 13.91 30.97c12.44 4.75 26.28-1.531 30.97-13.91L83.12 368h185.8l36.68 96.53C309.2 474.1 318.3 480 328 480c2.844 0 5.719-.5 8.531-1.562c12.39-4.719 18.61-18.56 13.91-30.97L198.4 47.47zM101.4 320L176 123.6L250.6 320H101.4zM616 160c-13.25 0-24 10.75-24 24v4.889c-21.99-17.79-49.58-28.88-80-28.88c-70.58 0-128 57.41-128 128l.0007 63.93c0 70.59 57.42 128.1 127.1 128.1c30.42 0 58.01-11.11 79.1-28.9V456c0 13.25 10.75 24 24 24S640 469.3 640 456v-272C640 170.8 629.3 160 616 160zM592 352c0 44.13-35.89 80-80 80s-80-35.88-80-80V288c0-44.13 35.89-80 80-80s80 35.88 80 80V352z" />
            </svg>
            <div class="lindy-theme-popup" id="lindy-theme-popup">
                <div class="lindy-plusminus">
                    <div id="lindy-fontsize-decrease">
                        <svg class="lindy-ui-icon" viewBox="0 0 448 512">
                            <path fill="currentColor" d="M400 288h-352c-17.69 0-32-14.32-32-32.01s14.31-31.99 32-31.99h352c17.69 0 32 14.3 32 31.99S417.7 288 400 288z"/>
                        </svg>
                    </div>
                    <div id="lindy-fontsize-increase">
                        <svg class="lindy-ui-icon" viewBox="0 0 448 512">
                            <path fill="currentColor" d="M432 256c0 17.69-14.33 32.01-32 32.01H256v144c0 17.69-14.33 31.99-32 31.99s-32-14.3-32-31.99v-144H48c-17.67 0-32-14.32-32-32.01s14.33-31.99 32-31.99H192v-144c0-17.69 14.33-32.01 32-32.01s32 14.32 32 32.01v144h144C417.7 224 432 238.3 432 256z"/>
                        </svg>
                    </div>
                </div>
                <div class="lindy-theme-popup-row-spacer"></div>
                <div class="lindy-plusminus">
                    <div id="lindy-pagewidth-decrease">
                        <svg class="lindy-ui-icon" viewBox="0 0 512 512" style="transform: rotate(45deg);">
                            <path fill="currentColor" d="M54.63 502.6L176 381.3V432c0 17.69 14.31 32 32 32s32-14.31 32-32v-128c0-4.164-.8477-8.312-2.465-12.22C234.3 283.9 228.1 277.7 220.2 274.5C216.3 272.8 212.2 272 208 272h-128c-17.69 0-32 14.31-32 32s14.31 32 32 32h50.75l-121.4 121.4c-12.5 12.5-12.5 32.75 0 45.25S42.13 515.1 54.63 502.6zM274.5 220.2c3.242 7.84 9.479 14.08 17.32 17.32C295.7 239.2 299.8 240 304 240h128c17.69 0 32-14.31 32-32s-14.31-32-32-32h-50.75l121.4-121.4c12.5-12.5 12.5-32.75 0-45.25c-12.49-12.49-32.74-12.51-45.25 0L336 130.8V80c0-17.69-14.31-32-32-32s-32 14.31-32 32v127.1C272 212.2 272.8 216.3 274.5 220.2z"/>
                        </svg>
                    </div>
                    <div id="lindy-pagewidth-increase">
                        <svg class="lindy-ui-icon" viewBox="0 0 512 512" style="transform: rotate(45deg);">
                            <path fill="currentColor" d="M177.4 289.4L64 402.8V352c0-17.69-14.31-32-32-32s-32 14.31-32 32v128c0 4.164 .8477 8.312 2.465 12.22c3.24 7.832 9.479 14.07 17.31 17.31C23.69 511.2 27.84 512 32 512h128c17.69 0 32-14.31 32-32s-14.31-32-32-32H109.3l113.4-113.4c12.5-12.5 12.5-32.75 0-45.25S189.9 276.9 177.4 289.4zM509.5 19.78c-3.242-7.84-9.479-14.08-17.32-17.32C488.3 .8477 484.2 0 480 0h-128c-17.69 0-32 14.31-32 32s14.31 32 32 32h50.75l-113.4 113.4c-12.5 12.5-12.5 32.75 0 45.25c12.49 12.49 32.74 12.51 45.25 0L448 109.3V160c0 17.69 14.31 32 32 32s32-14.31 32-32V32C512 27.84 511.2 23.69 509.5 19.78z"/>
                        </svg>
                    </div>
                </div>
                <div class="lindy-theme-popup-row-spacer"></div>
                <div class="lindy-theme-row">
                    <div>
                        <div class="lindy-theme-button lindy-active-theme" id="lindy-auto-theme-button">
                            <svg viewBox="0 0 512 512">
                                <path fill="currentColor" d="M327.5 85.19L384 64L405.2 7.491C406.9 2.985 411.2 0 416 0C420.8 0 425.1 2.985 426.8 7.491L448 64L504.5 85.19C509 86.88 512 91.19 512 96C512 100.8 509 105.1 504.5 106.8L448 128L426.8 184.5C425.1 189 420.8 192 416 192C411.2 192 406.9 189 405.2 184.5L384 128L327.5 106.8C322.1 105.1 320 100.8 320 96C320 91.19 322.1 86.88 327.5 85.19V85.19zM257.8 187.3L371.8 240C377.5 242.6 381.1 248.3 381.1 254.6C381.1 260.8 377.5 266.5 371.8 269.1L257.8 321.8L205.1 435.8C202.5 441.5 196.8 445.1 190.6 445.1C184.3 445.1 178.6 441.5 176 435.8L123.3 321.8L9.292 269.1C3.627 266.5 0 260.8 0 254.6C0 248.3 3.627 242.6 9.292 240L123.3 187.3L176 73.29C178.6 67.63 184.3 64 190.6 64C196.8 64 202.5 67.63 205.1 73.29L257.8 187.3zM405.2 327.5C406.9 322.1 411.2 320 416 320C420.8 320 425.1 322.1 426.8 327.5L448 384L504.5 405.2C509 406.9 512 411.2 512 416C512 420.8 509 425.1 504.5 426.8L448 448L426.8 504.5C425.1 509 420.8 512 416 512C411.2 512 406.9 509 405.2 504.5L384 448L327.5 426.8C322.1 425.1 320 420.8 320 416C320 411.2 322.1 406.9 327.5 405.2L384 384L405.2 327.5z"/>
                            </svg>
                        </div>
                    </div>
                    <div>
                        <div class="lindy-theme-button" id="lindy-white-theme-button"></div>
                    </div>
                    <div>
                        <div class="lindy-theme-button" id="lindy-dark-theme-button"></div>
                    </div>
                </div>
            </div>
        </div>
        <div id="lindy-annotations-toggle-container" class="lindy-tooltip lindy-fade">
            <!-- <svg> inserted in _setupAnnotationsToggle() below  -->
        </div>
        <div id="lindy-crowd-toggle-container" class="lindy-tooltip lindy-fade">
            <!-- <svg> inserted in _setupSocialToggle() below  -->
        </div>
    `
    );

    insertHtml(
        "lindy-page-settings-pageadjacent",
        `<div id="lindy-domain-switch-icon-container" class="lindy-tooltip lindy-tooltip-reverse lindy-fade">
            <!-- <svg> inserted in _setupDomainToggleState() below  -->
        </div>`
    );

    createStylesheetLink(
        browser.runtime.getURL("overlay/index.css"),
        "lindy-switch-style"
    );

    _setupDomainToggleState(domain);
    _setupLinkHandlers();
    _setupThemePopupHandlers(domain, themeModifier);
    _setupSocialToggle(annotationsModifer);

    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href =
        "https://fonts.googleapis.com/css2?family=Poppins:wght@400&display=swap";
    document.head.appendChild(fontLink);
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

// *** Social annotations toggle ***
let socialAnnotationsEnabled = null;
async function _setupSocialToggle(annotationsModifer: AnnotationsModifier) {
    const supportFeature = await getRemoteFeatureFlag(supportSocialAnnotations);
    if (!supportFeature) {
        return;
    }

    socialAnnotationsEnabled = await getFeatureFlag(
        showSocialAnnotationsDefaultFeatureFlag
    );

    const container = _renderSocialToggle();

    container.onclick = () => {
        socialAnnotationsEnabled = !socialAnnotationsEnabled;
        _renderSocialToggle();

        annotationsModifer.setShowSocialAnnotations(socialAnnotationsEnabled);

        reportEventContentScript("toggleSocialAnnotations", {
            newState: socialAnnotationsEnabled,
        });
    };
}
function _renderSocialToggle() {
    const container = document.getElementById("lindy-crowd-toggle-container");
    container.innerHTML = _getSocialToggleIcon(socialAnnotationsEnabled);
    container.setAttribute(
        "data-title",
        _getSocialToggleTooltip(socialAnnotationsEnabled)
    );

    return container;
}
function _getSocialToggleTooltip(enabled: boolean): string {
    if (enabled) {
        return `Click to hide social annotations`;
    } else {
        return `Click to show social annotations`;
    }
}
function _getSocialToggleIcon(enabled: boolean): string {
    if (enabled) {
        return `
        <svg class="lindy-ui-icon" id="lindy-annotations-icon" viewBox="0 0 640 512">
            <path fill="currentColor" d="M319.9 320c57.41 0 103.1-46.56 103.1-104c0-57.44-46.54-104-103.1-104c-57.41 0-103.1 46.56-103.1 104C215.9 273.4 262.5 320 319.9 320zM319.9 160c30.85 0 55.96 25.12 55.96 56S350.7 272 319.9 272S263.9 246.9 263.9 216S289 160 319.9 160zM512 160c44.18 0 80-35.82 80-80S556.2 0 512 0c-44.18 0-80 35.82-80 80S467.8 160 512 160zM369.9 352H270.1C191.6 352 128 411.7 128 485.3C128 500.1 140.7 512 156.4 512h327.2C499.3 512 512 500.1 512 485.3C512 411.7 448.4 352 369.9 352zM178.1 464c10.47-36.76 47.36-64 91.14-64H369.9c43.77 0 80.66 27.24 91.14 64H178.1zM551.9 192h-61.84c-12.8 0-24.88 3.037-35.86 8.24C454.8 205.5 455.8 210.6 455.8 216c0 33.71-12.78 64.21-33.16 88h199.7C632.1 304 640 295.6 640 285.3C640 233.8 600.6 192 551.9 192zM183.9 216c0-5.449 .9824-10.63 1.609-15.91C174.6 194.1 162.6 192 149.9 192H88.08C39.44 192 0 233.8 0 285.3C0 295.6 7.887 304 17.62 304h199.5C196.7 280.2 183.9 249.7 183.9 216zM128 160c44.18 0 80-35.82 80-80S172.2 0 128 0C83.82 0 48 35.82 48 80S83.82 160 128 160z" />
        </svg>`;
    } else {
        return `
        <svg class="lindy-ui-icon" id="lindy-annotations-icon" viewBox="0 0 640 512">
            <path fill="currentColor" d="M178.1 464c10.47-36.76 47.36-64 91.14-64H369.9c6.83 0 13.4 .873 19.82 2.133L325.7 352H270.1C191.6 352 128 411.7 128 485.3C128 500.1 140.7 512 156.4 512h327.2c11.62 0 21.54-6.587 25.95-15.96L468.6 464H178.1zM396.6 285.5C413.4 267.2 423.8 242.9 423.8 216c0-57.44-46.54-104-103.1-104c-35.93 0-67.07 18.53-85.59 46.3L193.1 126.1C202.4 113.1 208 97.24 208 80C208 35.82 172.2 0 128 0C103.8 0 82.52 10.97 67.96 27.95L38.81 5.109C34.41 1.672 29.19 0 24.03 0C16.91 0 9.846 3.156 5.127 9.188C-3.061 19.62-1.248 34.72 9.189 42.89l591.1 463.1c10.5 8.203 25.56 6.328 33.69-4.078c8.188-10.44 6.375-25.53-4.062-33.7L396.6 285.5zM358.9 255.1L271.8 187.7C281.6 171.2 299.3 160 319.9 160c30.85 0 55.96 25.12 55.96 56C375.8 231.7 369.3 245.8 358.9 255.1zM512 160c44.18 0 80-35.82 80-80S556.2 0 512 0c-44.18 0-80 35.82-80 80S467.8 160 512 160zM490.1 192c-12.8 0-24.88 3.037-35.86 8.24C454.8 205.5 455.8 210.6 455.8 216c0 33.71-12.78 64.21-33.16 88h199.7C632.1 304 640 295.6 640 285.3C640 233.8 600.6 192 551.9 192H490.1zM186.1 243.2L121.6 192H88.08C39.44 192 0 233.8 0 285.3C0 295.6 7.887 304 17.62 304h199.5C202.4 286.8 191.8 266.1 186.1 243.2z" />
        </svg>`;
    }
}

// *** Link icons: settings and bug report ***
function _setupLinkHandlers() {
    document.getElementById("lindy-settings-icon").onclick = () =>
        browser.runtime.sendMessage({ event: "openOptionsPage" });

    document.getElementById("lindy-bug-icon").onclick = () =>
        reportEventContentScript("reportBugClick");
}

// *** Theme popup ***
async function _setupThemePopupHandlers(
    domain: string,
    themeModifier: ThemeModifier
) {
    // Only report each type of modification once per page
    const reportedEventType = {};
    function _reportThemeEvent(changedProperty: string) {
        // Use nicer names
        if (changedProperty === fontSizeThemeVariable) {
            changedProperty = "fontSize";
        } else if (changedProperty === pageWidthThemeVariable) {
            changedProperty = "pageWidth";
        }

        if (!reportedEventType[changedProperty]) {
            reportEventContentScript("changeTheme", { changedProperty });
            reportedEventType[changedProperty] = true;
        }
    }

    // Setup plus and minus buttons
    function _changeCssPixelVariable(varName: string, delta: number) {
        const currentSize = getThemeValue(varName).replace("px", "");
        const newSizePx = `${parseFloat(currentSize) + delta}px`;

        applySaveThemeOverride(domain, varName, newSizePx);

        _reportThemeEvent(varName);
    }
    document.getElementById("lindy-fontsize-decrease").onclick = () =>
        _changeCssPixelVariable(fontSizeThemeVariable, -1);
    document.getElementById("lindy-fontsize-increase").onclick = () =>
        _changeCssPixelVariable(fontSizeThemeVariable, 1);

    document.getElementById("lindy-pagewidth-decrease").onclick = () =>
        _changeCssPixelVariable(pageWidthThemeVariable, -100);
    document.getElementById("lindy-pagewidth-increase").onclick = () =>
        _changeCssPixelVariable(pageWidthThemeVariable, 100);

    // Setup theme selection
    function _setTheme(themeName: themeName) {
        themeModifier.changeColorTheme(themeName);

        _reportThemeEvent("colorTheme");
    }
    document.getElementById("lindy-auto-theme-button").onclick = () =>
        _setTheme("auto");
    document.getElementById("lindy-white-theme-button").onclick = () =>
        _setTheme("white");
    document.getElementById("lindy-dark-theme-button").onclick = () =>
        _setTheme("dark");

    const activeTheme = await getUserTheme();
    if (activeTheme?.colorTheme) {
        highlightActiveColorThemeButton(activeTheme.colorTheme);
    }
}

export function highlightActiveColorThemeButton(themeName: themeName) {
    document
        .querySelectorAll(
            `.lindy-theme-button:not(#lindy-${themeName}-theme-button)`
        )
        .forEach((otherThemeNode) =>
            otherThemeNode.classList.remove("lindy-active-theme")
        );

    document
        .getElementById(`lindy-${themeName}-theme-button`)
        ?.classList.add("lindy-active-theme");
}
