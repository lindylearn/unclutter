import {
    allowlistDomainOnManualActivationFeatureFlag,
    getFeatureFlag,
    showOutlineFeatureFlag,
} from "source/common/featureFlags";
import {
    getUserSettingForDomain,
    setUserSettingsForDomain,
} from "source/common/storage";
import {
    insertPageSettings,
    updateDomainState,
    wiggleDomainState,
} from "../../overlay/insert";
import { getElementYOffset } from "../../overlay/outline/common";
import Outline from "../../overlay/outline/Outline.svelte";
import { getOutline, OutlineItem } from "../../overlay/outline/parse";
import AnnotationsModifier from "./annotations/annotationsModifier";
import ThemeModifier from "./CSSOM/theme";
import { PageModifier, trackModifierExecution } from "./_interface";

@trackModifierExecution
export default class OverlayManager implements PageModifier {
    private domain: string;
    private themeModifier: ThemeModifier;
    private annotationsModifer: AnnotationsModifier;

    private outline: OutlineItem[];
    private outlineSvelteComponent: Outline;

    constructor(
        domain: string,
        themeModifier: ThemeModifier,
        annotationsModifer: AnnotationsModifier
    ) {
        this.domain = domain;
        this.themeModifier = themeModifier;
        this.annotationsModifer = annotationsModifer;
    }

    async afterTransitionIn() {
        this.insertIframes();

        insertPageSettings(
            this.domain,
            this.themeModifier,
            this.annotationsModifer
        );

        const domainSetting = await getUserSettingForDomain(this.domain);
        const allowlistOnActivation = await getFeatureFlag(
            allowlistDomainOnManualActivationFeatureFlag
        );

        if (domainSetting === "allow") {
            wiggleDomainState(400);
        } else if (allowlistOnActivation && domainSetting === null) {
            const newDomainSetting = "allow";

            await setUserSettingsForDomain(this.domain, newDomainSetting);
            updateDomainState(newDomainSetting, this.domain);

            wiggleDomainState(400);
        }

        const showOutline = await getFeatureFlag(showOutlineFeatureFlag);
        if (showOutline) {
            this.enableOutline();
        }

        // this should be experimental
        // would also need to update URL during scrolling
        // scrollToFragmentHeading();
    }

    private enableOutline() {
        let headingCount: number;
        [this.outline, headingCount] = getOutline();
        if (headingCount < 3) {
            return;
        }

        this.insertOutline();
        this.listenToOutlineScroll();
    }

    private overlayIframe: HTMLIFrameElement;
    private async insertIframes() {
        const iframe = document.createElement("iframe");
        iframe.id = "lindy-info-topleft";
        iframe.setAttribute("scrolling", "no");
        iframe.setAttribute("frameBorder", "0");
        document.documentElement.appendChild(iframe);
        this.overlayIframe = iframe;

        // Firefox bug: need to wait until iframe initial render to insert elements
        // See https://stackoverflow.com/questions/60814167/firefox-deleted-innerhtml-of-generated-iframe
        await new Promise((r) => setTimeout(r, 0));
    }

    private async insertOutline() {
        this.outlineSvelteComponent = new Outline({
            target: this.overlayIframe.contentDocument.body,
            props: {
                outline: this.outline,
                activeOutlineIndex: this.outline[0].index,
            },
        });
    }

    private uninstallScrollListener: () => void;
    private listenToOutlineScroll() {
        function flatten(item: OutlineItem): OutlineItem[] {
            return [item].concat(item.children.flatMap(flatten));
        }
        const flatOutline = this.outline.flatMap(flatten);

        // listen to scroll changes, compare to last header
        let currentOutlineIndex = 0;
        let lowTheshold: number;
        let highTheshold: number;

        const updateTresholds = () => {
            const margin = 20; // a bit more than the auto scroll margin
            lowTheshold = getElementYOffset(
                flatOutline[currentOutlineIndex].element,
                margin
            );
            if (currentOutlineIndex + 1 < flatOutline.length) {
                highTheshold = getElementYOffset(
                    flatOutline[currentOutlineIndex + 1].element,
                    margin
                );
            } else {
                highTheshold = Infinity;
            }
        };
        updateTresholds();

        const scollListener = () => {
            if (window.scrollY === 0) {
                // start of document
                currentOutlineIndex = 0;
                updateTresholds();
            } else if (
                window.scrollY + window.innerHeight >=
                document.documentElement.scrollHeight - 20
            ) {
                // end of document
                currentOutlineIndex = flatOutline.length - 1;
                updateTresholds();
            } else if (
                currentOutlineIndex > 0 &&
                window.scrollY < lowTheshold
            ) {
                // scrolled up
                currentOutlineIndex -= 1;
                updateTresholds();
            } else if (window.scrollY >= highTheshold) {
                // scrolled down
                currentOutlineIndex += 1;
                updateTresholds();
            }

            const currentHeading = flatOutline[currentOutlineIndex];
            this.outlineSvelteComponent.$set({
                activeOutlineIndex: currentHeading.index,
            });
        };
        document.addEventListener("scroll", scollListener);

        this.uninstallScrollListener = () =>
            document.removeEventListener("scroll", scollListener);
    }

    async transitionOut() {
        document
            .getElementById("lindy-info-topleft")
            ?.classList.add("lindy-overlay-fadeout");
    }

    async afterTransitionOut() {
        document
            .querySelectorAll(
                ".lindy-page-settings-topright, .lindy-page-settings-pageadjacent, #lindy-info-topleft"
            )
            .forEach((e) => e.remove());

        if (this.uninstallScrollListener) {
            this.uninstallScrollListener();
        }
    }
}
