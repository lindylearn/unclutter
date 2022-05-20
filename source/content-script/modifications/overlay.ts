import { LindyAnnotation } from "../../common/annotations/create";
import {
    allowlistDomainOnManualActivationFeatureFlag,
    enableAnnotationsFeatureFlag,
    enableSocialCommentsFeatureFlag,
    getFeatureFlag,
    showOutlineFeatureFlag,
} from "../../common/featureFlags";
import browser from "../../common/polyfill";
import {
    getUserSettingForDomain,
    setUserSettingsForDomain,
} from "../../common/storage";
import {
    insertPageSettings,
    updateDomainState,
    updateSocialCommentsCount,
    wiggleDomainState,
} from "../../overlay/insert";
import { getElementYOffset } from "../../overlay/outline/common";
import {
    createRootItem,
    getOutline,
    OutlineItem,
} from "../../overlay/outline/parse";
import TopLeftContainer from "../../overlay/outline/TopLeftContainer.svelte";
import AnnotationsModifier from "./annotations/annotationsModifier";
import ThemeModifier from "./CSSOM/theme";
import { PageModifier, trackModifierExecution } from "./_interface";

@trackModifierExecution
export default class OverlayManager implements PageModifier {
    private domain: string;
    private themeModifier: ThemeModifier;
    private annotationsModifer: AnnotationsModifier;

    private outline: OutlineItem[];
    private flatOutline: OutlineItem[];
    private topleftSvelteComponent: TopLeftContainer;

    constructor(
        domain: string,
        themeModifier: ThemeModifier,
        annotationsModifer: AnnotationsModifier
    ) {
        this.domain = domain;
        this.themeModifier = themeModifier;
        this.annotationsModifer = annotationsModifer;

        this.annotationsModifer.annotationListeners.push(
            this.onAnnotationUpdate.bind(this)
        );
    }

    async afterTransitionIn() {
        this.insertIframes();

        insertPageSettings(
            this.domain,
            this.themeModifier,
            this.annotationsModifer,
            this
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

        // wait for outline parsing, but render regardless
        this.renderTopLeftContainer();

        // this should be experimental
        // would also need to update URL during scrolling
        // scrollToFragmentHeading();
    }

    setEnableAnnotations(enableAnnotations: boolean) {
        this.topleftSvelteComponent?.$set({
            annotationsEnabled: enableAnnotations,
        });
    }

    private enableOutline() {
        this.outline = getOutline();
        if (this.outline.length <= 3) {
            // note that 'Introduction' heading always exists
            // Use just article title, as outline likely not useful or invalid
            this.outline = [createRootItem()];
        }

        function flatten(item: OutlineItem): OutlineItem[] {
            return [item].concat(item.children.flatMap(flatten));
        }
        this.flatOutline = this.outline.flatMap(flatten);

        this.listenToOutlineScroll();
    }

    private topleftIframe: HTMLIFrameElement;
    private async insertIframes() {
        const iframe = document.createElement("iframe");
        iframe.classList.add("lindy-allowed-iframe");
        iframe.id = "lindy-info-topleft";
        iframe.setAttribute("scrolling", "no");
        iframe.setAttribute("frameBorder", "0");
        document.documentElement.appendChild(iframe);
        this.topleftIframe = iframe;

        // Firefox bug: nseed to wait until iframe initial render to insert elements
        // See https://stackoverflow.com/questions/60814167/firefox-deleted-innerhtml-of-generated-iframe
        await new Promise((r) => setTimeout(r, 0));

        const fontLink = iframe.contentDocument.createElement("link");
        fontLink.rel = "stylesheet";
        fontLink.href =
            "https://fonts.googleapis.com/css2?family=Work+Sans:wght@400&family=Poppins:wght@600&display=swap";
        iframe.contentDocument.head.appendChild(fontLink);
    }

    private async renderTopLeftContainer() {
        const annotationsEnabled = await getFeatureFlag(
            enableAnnotationsFeatureFlag
        );

        this.topleftSvelteComponent = new TopLeftContainer({
            target: this.topleftIframe.contentDocument.body,
            props: {
                outline: this.outline, // null at first
                activeOutlineIndex: this.outline?.[0].index,
                annotationsEnabled,
            },
        });
    }

    private uninstallScrollListener: () => void;
    private listenToOutlineScroll() {
        // listen to scroll changes, compare to last header
        let currentOutlineIndex = 0;
        let lowTheshold: number;
        let highTheshold: number;

        const updateTresholds = () => {
            const margin = 20; // a bit more than the auto scroll margin
            lowTheshold = getElementYOffset(
                this.flatOutline[currentOutlineIndex].element,
                margin
            );
            if (currentOutlineIndex + 1 < this.flatOutline.length) {
                highTheshold = getElementYOffset(
                    this.flatOutline[currentOutlineIndex + 1].element,
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
                currentOutlineIndex = this.flatOutline.length - 1;
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

            const currentHeading = this.flatOutline[currentOutlineIndex];
            this.topleftSvelteComponent?.$set({
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

    // listen to annotation updates and attribute to outline heading
    private totalAnnotationCount = 0;
    private totalSocialCommentsCount = 0;
    private async onAnnotationUpdate(
        action: "set" | "add" | "remove",
        annotations: LindyAnnotation[]
    ) {
        if (!this.flatOutline || this.flatOutline.length === 0) {
            return;
        }

        if (
            action === "remove" &&
            this.totalAnnotationCount === 0 &&
            this.totalSocialCommentsCount === 0
        ) {
            // removing overlapping annotations before displaying them -- ignore this
            return;
        }

        if (action === "set") {
            // reset state
            this.totalAnnotationCount = 0;
            this.totalSocialCommentsCount = 0;
            this.flatOutline.map((_, index) => {
                this.flatOutline[index].myAnnotationCount = 0;
                this.flatOutline[index].socialCommentsCount = 0;
            });
        }

        annotations.map((annotation) => {
            const outlineIndex = this.getOutlineIndexForAnnotation(annotation);

            if (!annotation.isMyAnnotation) {
                if (action === "set" || action === "add") {
                    this.totalSocialCommentsCount += 1;
                    this.flatOutline[outlineIndex].socialCommentsCount += 1;
                } else if (action === "remove") {
                    this.totalSocialCommentsCount -= 1;
                    this.flatOutline[outlineIndex].socialCommentsCount -= 1;
                }
            } else {
                if (action === "set" || action === "add") {
                    this.totalAnnotationCount += 1;
                    this.flatOutline[outlineIndex].myAnnotationCount += 1;
                } else if (action === "remove") {
                    this.totalAnnotationCount -= 1;
                    this.flatOutline[outlineIndex].myAnnotationCount -= 1;
                }
            }
        });

        this.topleftSvelteComponent?.$set({
            totalAnnotationCount: this.totalAnnotationCount,
            outline: this.outline,
        });

        if (this.totalSocialCommentsCount === 0) {
            const socialAnnotationsEnabled = await getFeatureFlag(
                enableSocialCommentsFeatureFlag
            );
            if (!socialAnnotationsEnabled) {
                // expected to find 0 displayed social annotations
                // don't update counts, we might still want to show them
                return;
            }
        }
        updateSocialCommentsCount(this.totalSocialCommentsCount);
        browser.runtime.sendMessage(null, {
            event: "setSocialAnnotationsCount",
            count: this.totalSocialCommentsCount,
        });
    }

    disableSocialAnnotations() {
        this.flatOutline.map((_, index) => {
            this.flatOutline[index].socialCommentsCount = 0;
        });
        this.topleftSvelteComponent?.$set({
            totalAnnotationCount: this.totalAnnotationCount,
            outline: this.outline,
        });
    }

    private getOutlineIndexForAnnotation(annotation: LindyAnnotation): number {
        if (!this.flatOutline) {
            return null;
        }

        // TODO cache outline offsets?

        let lastIndex: number = 0;
        while (lastIndex + 1 < this.flatOutline.length) {
            const item = this.flatOutline[lastIndex + 1];
            const startOffset = getElementYOffset(item.element);
            if (annotation.displayOffset < startOffset) {
                break;
            }

            lastIndex += 1;
        }

        return lastIndex;
    }

    updateReadingTimeLeft(minutes: number) {
        this.topleftSvelteComponent?.$set({
            readingTimeLeft: minutes,
        });
    }
}
