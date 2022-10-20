<script lang="ts">
    import browser from "../../../common/polyfill";
    import {
        domainUserSetting,
        getUserSettingForDomain,
        setUserSettingsForDomain,
    } from "../..//../common/storage";
    import { reportEventContentScript } from "@unclutter/library-components/dist/common";
    import UIControl from "./UIControl.svelte";
    import { togglePageView } from "../..//../content-script/enhance";
    import {
        allowlistDomainOnManualActivationFeatureFlag,
        getFeatureFlag,
    } from "../../../common/featureFlags";

    export let domain: string;

    let isInitialSetting: boolean = true;
    let currentUserSetting: domainUserSetting = null;
    (async () => {
        currentUserSetting = await getUserSettingForDomain(domain);

        const allowlistOnActivation = await getFeatureFlag(
            allowlistDomainOnManualActivationFeatureFlag
        );

        if (allowlistOnActivation && currentUserSetting === null) {
            await new Promise((r) => setTimeout(r, 600));
            toggleState();
        }
    })();

    function toggleState() {
        let nextUserSetting: domainUserSetting;
        if (currentUserSetting === "allow") {
            nextUserSetting = "deny";
        } else if (currentUserSetting === "deny") {
            nextUserSetting = "allow";
        } else {
            nextUserSetting = "allow";
        }

        isInitialSetting = false;
        currentUserSetting = nextUserSetting;
        setUserSettingsForDomain(domain, currentUserSetting);

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

        reportEventContentScript("changeDomainSetting", {
            newState: nextUserSetting,
            trigger: "icon",
        });
    }

    function getIconName(currentUserSetting: domainUserSetting): string {
        if (currentUserSetting === "allow") {
            return "auto_enabled";
        } else if (currentUserSetting === "deny") {
            return "auto_disabled";
        } else {
            return "auto_default";
        }
    }
    function getTooltip(currentUserSetting: domainUserSetting): string {
        if (currentUserSetting === "allow") {
            return `Disable automatic activation`;
        } else if (currentUserSetting === "deny") {
            return `Enable automatic activation`;
        } else {
            return `Click to automatically unclutter ${domain}`;
        }
    }
</script>

<UIControl
    iconName={getIconName(currentUserSetting)}
    tooltip={getTooltip(currentUserSetting)}
    tooltipReverse
    onClick={toggleState}
    className={(currentUserSetting === "allow" ? "lindy-domain-switch-wiggle " : " ") +
        (isInitialSetting && currentUserSetting === "allow"
            ? "lindy-domain-switch-wiggle-initial-delay"
            : "")}
/>

<style global lang="postcss">
    .lindy-domain-switch-wiggle > svg {
        animation: wiggle 0.6s ease-in-out;
    }
    .lindy-domain-switch-wiggle-initial-delay > svg {
        animation-delay: 0.6s;
    }
    @keyframes wiggle {
        0% {
            transform: rotate(10deg);
        }
        25% {
            transform: rotate(-20deg);
        }
        50% {
            transform: rotate(10deg);
        }
        75% {
            transform: rotate(-10deg);
        }
        100% {
            transform: rotate(0deg);
        }
    }
</style>
