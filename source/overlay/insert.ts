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
                <path fill="currentColor" d="M168 255.1C168 207.4 207.4 167.1 256 167.1C304.6 167.1 344 207.4 344 255.1C344 304.6 304.6 344 256 344C207.4 344 168 304.6 168 255.1zM256 199.1C225.1 199.1 200 225.1 200 255.1C200 286.9 225.1 311.1 256 311.1C286.9 311.1 312 286.9 312 255.1C312 225.1 286.9 199.1 256 199.1zM65.67 230.6L25.34 193.8C14.22 183.7 11.66 167.2 19.18 154.2L49.42 101.8C56.94 88.78 72.51 82.75 86.84 87.32L138.8 103.9C152.2 93.56 167 84.96 182.8 78.43L194.5 25.16C197.7 10.47 210.7 0 225.8 0H286.2C301.3 0 314.3 10.47 317.5 25.16L329.2 78.43C344.1 84.96 359.8 93.56 373.2 103.9L425.2 87.32C439.5 82.75 455.1 88.78 462.6 101.8L492.8 154.2C500.3 167.2 497.8 183.7 486.7 193.8L446.3 230.6C447.4 238.9 448 247.4 448 255.1C448 264.6 447.4 273.1 446.3 281.4L486.7 318.2C497.8 328.3 500.3 344.8 492.8 357.8L462.6 410.2C455.1 423.2 439.5 429.2 425.2 424.7L373.2 408.1C359.8 418.4 344.1 427 329.2 433.6L317.5 486.8C314.3 501.5 301.3 512 286.2 512H225.8C210.7 512 197.7 501.5 194.5 486.8L182.8 433.6C167 427 152.2 418.4 138.8 408.1L86.84 424.7C72.51 429.2 56.94 423.2 49.42 410.2L19.18 357.8C11.66 344.8 14.22 328.3 25.34 318.2L65.67 281.4C64.57 273.1 64 264.6 64 255.1C64 247.4 64.57 238.9 65.67 230.6V230.6zM158.4 129.2L145.1 139.5L77.13 117.8L46.89 170.2L99.58 218.2L97.39 234.8C96.47 241.7 96 248.8 96 255.1C96 263.2 96.47 270.3 97.39 277.2L99.58 293.8L46.89 341.8L77.13 394.2L145.1 372.5L158.4 382.8C169.5 391.4 181.9 398.6 195 403.1L210.5 410.4L225.8 480H286.2L301.5 410.4L316.1 403.1C330.1 398.6 342.5 391.4 353.6 382.8L366.9 372.5L434.9 394.2L465.1 341.8L412.4 293.8L414.6 277.2C415.5 270.3 416 263.2 416 256C416 248.8 415.5 241.7 414.6 234.8L412.4 218.2L465.1 170.2L434.9 117.8L366.9 139.5L353.6 129.2C342.5 120.6 330.1 113.4 316.1 108L301.5 101.6L286.2 32H225.8L210.5 101.6L195 108C181.9 113.4 169.5 120.6 158.4 129.2H158.4z" />
            </svg>
        </div>
        <a href="${githubLink}" target="_blank" rel="noopener noreferrer" class="lindy-tooltip lindy-fade" data-title="Report bug">
            <svg class="lindy-ui-icon" id="lindy-bug-icon" viewBox="0 0 512 512">
                <path fill="currentColor" d="M160 96C160 42.98 202.1 0 256 0C309 0 352 42.98 352 96V99.56C352 115.3 339.3 128 323.6 128H188.4C172.7 128 160 115.3 160 99.56V96zM192 96H320C320 60.65 291.3 32 256 32C220.7 32 192 60.65 192 96zM36.69 100.7C42.93 94.44 53.07 94.44 59.31 100.7L138.6 180C155.8 167.4 177.1 160 200 160H312C334.9 160 356.2 167.4 373.4 180L452.7 100.7C458.9 94.44 469.1 94.44 475.3 100.7C481.6 106.9 481.6 117.1 475.3 123.3L395.1 202.6C408.6 219.8 416 241.1 416 264V272H496C504.8 272 512 279.2 512 288C512 296.8 504.8 304 496 304H416V320C416 350.2 407.6 378.4 393.1 402.5L475.3 484.7C481.6 490.9 481.6 501.1 475.3 507.3C469.1 513.6 458.9 513.6 452.7 507.3L373.7 428.4C344.5 460.1 302.6 480 256 480C209.4 480 167.5 460.1 138.3 428.4L59.31 507.3C53.07 513.6 42.94 513.6 36.69 507.3C30.44 501.1 30.44 490.9 36.69 484.7L118.9 402.5C104.4 378.4 96 350.2 96 319.1V303.1H16C7.164 303.1 0 296.8 0 287.1C0 279.2 7.164 271.1 16 271.1H96V263.1C96 241.1 103.4 219.8 116 202.6L36.69 123.3C30.44 117.1 30.44 106.9 36.69 100.7V100.7zM128 320C128 385.3 176.9 439.1 240 447V256C240 247.2 247.2 240 256 240C264.8 240 272 247.2 272 256V447C335.1 439.1 384 385.3 384 320V264C384 224.2 351.8 192 312 192H200C160.2 192 128 224.2 128 264V320z" />
            </svg>
        </a>
        <div class="lindy-theme-popup-container" data-title="Article theme">
            <svg class="lindy-ui-icon" id="lindy-theme-icon" viewBox="0 0 640 512">
                <path fill="currentColor" d="M190.9 41.3c-4.75-12.4-25.12-12.4-29.87 0L1.069 458.2c-3.172 8.268 .9531 17.54 9.187 20.73c8.25 3.163 17.5-.9709 20.69-9.207l45.28-118H275.8l45.28 118C323.5 476.1 329.6 480 336 480c1.906 0 3.859-.3445 5.75-1.065c8.234-3.194 12.36-12.46 9.187-20.73L190.9 41.3zM88.54 319.7l87.47-227.9l87.47 227.9H88.54zM624 159.3c-8.844 0-15.1 7.172-15.1 16.03v28.29c-23.48-26.94-57.59-44.33-95.1-44.33c-70.58 0-127.1 57.53-127.1 128.3l-.002 64.35c0 70.75 57.42 128.1 127.1 128.1c38.41 0 72.52-17.4 96-44.33v28.29C608 472.8 615.2 480 624 480C632.8 480 640 472.8 640 463.1V175.3C640 166.5 632.8 159.3 624 159.3zM608 351.7c0 53.05-43.06 96.21-95.1 96.21c-52.94 0-95.1-43.16-95.1-96.21V287.6c0-53.05 43.06-96.21 95.1-96.21c52.94 0 95.1 43.16 95.1 96.21V351.7z" />
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
            <!-- <svg> inserted in _setupSocialAnnotationsToggle() below  -->
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
    _setupSocialAnnotationsToggle(annotationsModifer);

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
            <path fill="currentColor" d="M240.5 224H352C365.3 224 377.3 232.3 381.1 244.7C386.6 257.2 383.1 271.3 373.1 280.1L117.1 504.1C105.8 513.9 89.27 514.7 77.19 505.9C65.1 497.1 60.7 481.1 66.59 467.4L143.5 288H31.1C18.67 288 6.733 279.7 2.044 267.3C-2.645 254.8 .8944 240.7 10.93 231.9L266.9 7.918C278.2-1.92 294.7-2.669 306.8 6.114C318.9 14.9 323.3 30.87 317.4 44.61L240.5 224z"/>
        </svg>`;
    } else if (userSetting === "deny") {
        return `
        <svg class="lindy-ui-icon" id="lindy-domain-switch-icon" viewBox="0 0 512 512" style="overflow: visible; margin-left: -5px; margin-right: 5px;">
            <path fill="currentColor" d="M228.4 153.7L394.9 7.918C406.2-1.92 422.7-2.669 434.8 6.114C446.9 14.9 451.3 30.87 445.4 44.61L368.5 224H480C493.3 224 505.3 232.3 509.1 244.7C514.6 257.2 511.1 271.3 501.1 280.1L448.4 326.2L630.8 469.1C641.2 477.3 643.1 492.4 634.9 502.8C626.7 513.2 611.6 515.1 601.2 506.9L9.196 42.89C-1.236 34.71-3.065 19.63 5.112 9.196C13.29-1.236 28.37-3.065 38.81 5.112L228.4 153.7zM138.9 231.9L154.8 217.1L243.7 288H160C146.7 288 134.7 279.7 130 267.3C125.4 254.8 128.9 240.7 138.9 231.9L138.9 231.9zM194.6 467.4L264.5 304.4L374.4 390.1L245.1 504.1C233.8 513.9 217.3 514.7 205.2 505.9C193.1 497.1 188.7 481.1 194.6 467.4V467.4z"/>
        </svg>`;
    } else {
        return `
        <svg class="lindy-ui-icon" id="lindy-domain-switch-icon" viewBox="0 0 512 512" style="overflow: visible;">
            <path fill="currentColor" d="M240.5 224H352C365.3 224 377.3 232.3 381.1 244.7C386.6 257.2 383.1 271.3 373.1 280.1L117.1 504.1C105.8 513.9 89.27 514.7 77.19 505.9C65.1 497.1 60.7 481.1 66.59 467.4L143.5 288H32C18.67 288 6.735 279.7 2.046 267.3C-2.643 254.8 .8963 240.7 10.93 231.9L266.9 7.918C278.2-1.92 294.7-2.669 306.8 6.114C318.9 14.9 323.3 30.87 317.4 44.61L240.5 224zM464 288C476.1 288 487.2 294.8 492.6 305.7L572.6 465.7C580.5 481.5 574.1 500.7 558.3 508.6C542.5 516.5 523.3 510.1 515.4 494.3L508.2 480H419.8L412.6 494.3C404.7 510.1 385.5 516.5 369.7 508.6C353.9 500.7 347.5 481.5 355.4 465.7L435.4 305.7C440.8 294.8 451.9 288 464 288H464zM447.8 424H480.2L464 391.6L447.8 424z"/>
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
async function _setupSocialAnnotationsToggle(
    annotationsModifer: AnnotationsModifier
) {
    const supportFeature = await getRemoteFeatureFlag(supportSocialAnnotations);
    if (!supportFeature) {
        return;
    }

    socialAnnotationsEnabled = await getFeatureFlag(
        showSocialAnnotationsDefaultFeatureFlag
    );

    const container = _renderAnnotationsToggle();

    container.onclick = () => {
        socialAnnotationsEnabled = !socialAnnotationsEnabled;
        _renderAnnotationsToggle();

        annotationsModifer.setShowSocialAnnotations(socialAnnotationsEnabled);

        reportEventContentScript("toggleSocialAnnotations", {
            newState: socialAnnotationsEnabled,
        });
    };
}
function _renderAnnotationsToggle() {
    const container = document.getElementById(
        "lindy-annotations-toggle-container"
    );
    container.innerHTML = _getAnnotationsToggleIcon(socialAnnotationsEnabled);
    container.setAttribute(
        "data-title",
        _getAnnotationsToggleTooltip(socialAnnotationsEnabled)
    );

    return container;
}
function _getAnnotationsToggleTooltip(enabled: boolean): string {
    if (enabled) {
        return `Click to hide social annotations`;
    } else {
        return `Click to show social annotations`;
    }
}
function _getAnnotationsToggleIcon(enabled: boolean): string {
    if (enabled) {
        return `
        <svg class="lindy-ui-icon" id="lindy-annotations-icon" viewBox="0 0 640 512">
            <path fill="currentColor" d="M319.9 320c57.41 0 103.1-46.56 103.1-104c0-57.44-46.54-104-103.1-104c-57.41 0-103.1 46.56-103.1 104C215.9 273.4 262.5 320 319.9 320zM319.9 144c39.68 0 71.96 32.3 71.96 72S359.5 288 319.9 288S247.9 255.7 247.9 216S280.2 144 319.9 144zM369.9 352H270.1C191.6 352 128 411.7 128 485.3C128 500.1 140.7 512 156.4 512h327.2C499.3 512 512 500.1 512 485.3C512 411.7 448.4 352 369.9 352zM160.2 480c3.021-53.41 51.19-96 109.1-96H369.9c58.78 0 106.9 42.59 109.1 96H160.2zM512 160c44.18 0 80-35.82 80-80S556.2 0 512 0c-44.18 0-80 35.82-80 80S467.8 160 512 160zM512 32c26.47 0 48 21.53 48 48S538.5 128 512 128s-48-21.53-48-48S485.5 32 512 32zM128 160c44.18 0 80-35.82 80-80S172.2 0 128 0C83.82 0 48 35.82 48 80S83.82 160 128 160zM128 32c26.47 0 48 21.53 48 48S154.5 128 128 128S80 106.5 80 80S101.5 32 128 32zM561.1 192H496c-11.16 0-22.08 2.5-32.47 7.438c-7.984 3.797-11.39 13.34-7.594 21.31s13.38 11.39 21.31 7.594C483.3 225.5 489.6 224 496 224h65.08C586.1 224 608 246.7 608 274.7V288c0 8.844 7.156 16 16 16S640 296.8 640 288V274.7C640 229.1 604.6 192 561.1 192zM162.8 228.3c7.938 3.797 17.53 .375 21.31-7.594c3.797-7.969 .3906-17.52-7.594-21.31C166.1 194.5 155.2 192 144 192H78.92C35.41 192 0 229.1 0 274.7V288c0 8.844 7.156 16 16 16S32 296.8 32 288V274.7C32 246.7 53.05 224 78.92 224H144C150.4 224 156.7 225.5 162.8 228.3z" />
        </svg>`;
    } else {
        return `
        <svg class="lindy-ui-icon" id="lindy-annotations-icon" viewBox="0 0 640 512" style="overflow: visible; margin-left: -0.5px; margin-right: 0.5px;">
            <path fill="currentColor" d="M224 256c70.7 0 128-57.31 128-128s-57.3-128-128-128C153.3 0 96 57.31 96 128S153.3 256 224 256zM224 32c52.94 0 96 43.06 96 96c0 52.93-43.06 96-96 96S128 180.9 128 128C128 75.06 171.1 32 224 32zM274.7 304H173.3C77.61 304 0 381.6 0 477.3c0 19.14 15.52 34.67 34.66 34.67h378.7C432.5 512 448 496.5 448 477.3C448 381.6 370.4 304 274.7 304zM413.3 480H34.66C33.2 480 32 478.8 32 477.3C32 399.4 95.4 336 173.3 336h101.3C352.6 336 416 399.4 416 477.3C416 478.8 414.8 480 413.3 480z" />
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
