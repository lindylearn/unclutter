import { initTheme } from "source/common/theme";
import browser from "../common/polyfill";
import { getDomainFrom } from "../common/util";
import BackgroundModifier from "./modifications/background";
import BodyStyleModifier from "./modifications/bodyStyle";
import ContentBlockModifier from "./modifications/contentBlock";
import ResponsiveStyleModifier from "./modifications/CSSOM/responsiveStyle";
import TextContainerModifier from "./modifications/DOM/textContainer";
import OverlayManager from "./modifications/overlay";
import { enablePageView } from "./pageview/enablePageView";
import { fadeOutNoise, transitionIn, transitionOut } from "./transitions";

// complete extension functionality injected into a tab

// NOTE: NOT A CONTENT SCRIPT. Using browser.runtime after the initial execution loop seems to make Chrome
// think it's a service worker and it terminates the background script on reload.

// listen to events sent from background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.event === "ping") {
        // respond that extension is active in this tab
        const pageViewEnabled =
            document.documentElement.classList.contains("pageview");
        sendResponse({ pageViewEnabled });
        return true;
    } else if (message.event === "togglePageView") {
        togglePageView();
        return false;
    }
});

let isSimulatedClick = false;
export async function togglePageView() {
    // manually toggle pageview status in this tab

    const pageViewEnabled =
        document.documentElement.classList.contains("pageview");

    if (!pageViewEnabled) {
        const domain = getDomainFrom(new URL(window.location.href));

        // construct modifier classes
        const backgroundModifier = new BackgroundModifier();
        const contentBlockModifier = new ContentBlockModifier();
        const bodyStyleModifier = new BodyStyleModifier();
        const domModifier = new TextContainerModifier();
        const cssomModifer = new ResponsiveStyleModifier();
        const overlayManager = new OverlayManager(domain);

        const themeName = await initTheme(domain);
        cssomModifer.parse(themeName);
        domModifier.parse();

        // *** Fade-out phase ***
        // Visibly hide noisy elements and meanwhile perform heavy operation

        // wait up to 200ms for animation completion
        // don't wait after very long parsing time
        await Promise.all([
            fadeOutNoise(
                domain,
                backgroundModifier,
                contentBlockModifier,
                domModifier,
                cssomModifer
            ),
            new Promise((r) => setTimeout(r, 300)),
        ]);

        // *** PageView transition phase ***
        // Shift layout and reduce page width in one go

        await transitionIn(
            domain,
            contentBlockModifier,
            bodyStyleModifier,
            domModifier,
            cssomModifer,
            overlayManager
        );

        isSimulatedClick = false;
        await enablePageView(async () => {
            // when user exists page view
            // undo all modifications (including css rewrites and style changes)
            await transitionOut(
                contentBlockModifier,
                bodyStyleModifier,
                domModifier,
                cssomModifer,
                overlayManager
            );

            if (!isSimulatedClick) {
                // already emitted elsewhere for simulated non-background clicks
                browser.runtime.sendMessage(null, {
                    event: "disabledPageView",
                    trigger: "backgroundClick",
                });
            }
        }, true);
    } else {
        // hack: simulate click to call disable handlers with correct state (also from boot.js)
        isSimulatedClick = true;
        document.documentElement.click();
    }
}

// perform style changes if pageview was already triggered by boot.js
async function enhance() {
    const pageViewEnabled =
        document.documentElement.classList.contains("pageview");
    if (!pageViewEnabled) {
        togglePageView();
        return;
    }
    // use normal enhance workflow for now

    // console.log("enhance page");

    // const domain = getDomainFrom(new URL(window.location.href));

    // const [contentBlockFadeOut, contentBlockHide, contentBlockFadeIn] =
    //     insertContentBlockStyle();

    // const [fadeOutDom, patchDom] = iterateDOM();
    // fadeOutDom();

    // initTheme(domain);
    // insertBackground();

    // pageViewTransition(domain, () => {}, contentBlockHide, patchDom);

    // // attach additional style unpatch functionality on pageview hide
    // document.documentElement.addEventListener(
    //     "click",
    //     (event) => {
    //         if (event.target.tagName === "HTML") {
    //             disableStyleChanges();
    //         }
    //     },
    //     true
    // );
}
enhance();
