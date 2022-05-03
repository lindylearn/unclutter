import { LindyAnnotation } from "../../common/annotations/create";
import {
    allowlistDomainOnManualActivationFeatureFlag,
    getFeatureFlag,
    showOutlineFeatureFlag,
} from "../../common/featureFlags";
import {
    getUserSettingForDomain,
    setUserSettingsForDomain,
} from "../../common/storage";
import {
    insertPageSettings,
    updateDomainState,
    wiggleDomainState,
} from "../../overlay/insert";
import { getElementYOffset } from "../../overlay/outline/common";
import { getOutline, OutlineItem } from "../../overlay/outline/parse";
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

        // wait for outline parsing, but render regardless
        this.renderTopLeftContainer();

        // this should be experimental
        // would also need to update URL during scrolling
        // scrollToFragmentHeading();
    }

    private enableOutline() {
        let outline: OutlineItem[];
        let headingCount: number;
        [outline, headingCount] = getOutline();
        if (headingCount < 3) {
            // ignore small outlines (not useful)
            return;
        }

        this.outline = outline;

        this.listenToOutlineScroll();
    }

    private topleftIframe: HTMLIFrameElement;
    private async insertIframes() {
        const iframe = document.createElement("iframe");
        iframe.id = "lindy-info-topleft";
        iframe.setAttribute("scrolling", "no");
        iframe.setAttribute("frameBorder", "0");
        document.documentElement.appendChild(iframe);
        this.topleftIframe = iframe;

        const fontLink = iframe.contentDocument.createElement("link");
        fontLink.rel = "stylesheet";
        fontLink.href =
            "https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;600;700&family=Poppins:wght@400;600;700&display=swap";
        iframe.contentDocument.head.appendChild(fontLink);

        // Firefox bug: need to wait until iframe initial render to insert elements
        // See https://stackoverflow.com/questions/60814167/firefox-deleted-innerhtml-of-generated-iframe
        await new Promise((r) => setTimeout(r, 0));
    }

    private async renderTopLeftContainer() {
        this.topleftSvelteComponent = new TopLeftContainer({
            target: this.topleftIframe.contentDocument.body,
            props: {
                outline: this.outline, // null at first
                activeOutlineIndex: this.outline?.[0].index,
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
    private onAnnotationUpdate(
        action: "set" | "add" | "remove",
        annotations: LindyAnnotation[]
    ) {
        if (!this.outline || this.outline.length === 0) {
            return;
        }

        const outlineIndexes = annotations.map((a) =>
            this.getOutlineIndexForAnnotation(a)
        );
        console.log(annotations, outlineIndexes);

        if (action === "set") {
            this.totalAnnotationCount = annotations.length;

            this.outline.map(
                (_, index) => (this.outline[index].annotationCount = 0)
            );
            outlineIndexes.map(
                (index) => (this.outline[index].annotationCount += 1)
            );
        } else if (action === "add") {
            this.totalAnnotationCount += annotations.length;
            outlineIndexes.map(
                (index) => (this.outline[index].annotationCount += 1)
            );
        } else if (action === "remove") {
            this.totalAnnotationCount -= annotations.length;
            outlineIndexes.map(
                (index) => (this.outline[index].annotationCount -= 1)
            );
        }

        this.topleftSvelteComponent?.$set({
            totalAnnotationCount: this.totalAnnotationCount,
            outline: this.outline,
        });
    }
    private getOutlineIndexForAnnotation(annotation: LindyAnnotation): number {
        if (!this.outline) {
            return null;
        }

        // TODO cache outline offsets?

        let lastIndex: number = 0;
        while (lastIndex + 1 < this.outline.length) {
            const item = this.outline[lastIndex + 1];
            const startOffset = getElementYOffset(item.element);
            if (annotation.displayOffset < startOffset) {
                break;
            }

            lastIndex += 1;
        }

        return lastIndex;
    }
}
