import {
    allowlistDomainOnManualActivationFeatureFlag,
    getFeatureFlag,
} from "source/common/featureFlags";
import {
    getUserSettingForDomain,
    setUserSettingsForDomain,
} from "source/common/storage";
import {
    insertPageSettings,
    updateDomainState,
    whiggleDomainState,
} from "../overlay/insert";
import { getElementYOffset } from "../overlay/outline/common";
import Outline from "../overlay/outline/Outline.svelte";
import { getOutline, OutlineItem } from "../overlay/outline/parse";
import ThemeModifier from "./CSSOM/theme";
import { PageModifier, trackModifierExecution } from "./_interface";

@trackModifierExecution
export default class OverlayManager implements PageModifier {
    private domain: string;
    private themeModifier: ThemeModifier;

    constructor(domain: string, themeModifier: ThemeModifier) {
        this.domain = domain;
        this.themeModifier = themeModifier;
    }

    async afterTransitionIn() {
        insertPageSettings(this.domain, this.themeModifier);

        const domainSetting = await getUserSettingForDomain(this.domain);
        const allowlistOnActivation = await getFeatureFlag(
            allowlistDomainOnManualActivationFeatureFlag
        );

        if (domainSetting === "allow") {
            whiggleDomainState();
        } else if (allowlistOnActivation && domainSetting === null) {
            const newDomainSetting = "allow";

            await setUserSettingsForDomain(this.domain, newDomainSetting);
            updateDomainState(newDomainSetting, this.domain);

            whiggleDomainState();
        }

        // sometimes content block takes time
        // TODO ensure afterTransitionIn() actually runs later?
        // https://www.quantamagazine.org/researchers-identify-master-problem-underlying-all-cryptography-20220406/
        setTimeout(() => {
            const outline = getOutline();

            const container = document.createElement("div");
            document.documentElement.appendChild(container);

            const component = new Outline({
                target: container,
                props: { outline, activeOutlineIndex: 0 },
            });

            // this should be experimental
            // would also need to update URL during scrolling
            // maybe that's annoying?
            // scrollToFragmentHeading();

            function flatten(item: OutlineItem): OutlineItem[] {
                return [item].concat(item.children.flatMap(flatten));
            }
            const flatOutline = flatten(outline);

            function onChangeActiveHeading(activeOutlineIndex: number) {
                // console.log(flatOutline[currentOutlineIndex].title);

                component.$set({ activeOutlineIndex: activeOutlineIndex });
            }

            // current header
            // listen to scroll changes, compare to last header
            // update if changed
            let currentOutlineIndex = 0;
            let lowTheshold: number;
            let highTheshold: number;
            function updateTresholds() {
                const margin = 25; // a bit more than the auto scroll margin
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
            }
            updateTresholds();

            document.addEventListener("scroll", () => {
                if (currentOutlineIndex > 0 && window.scrollY < lowTheshold) {
                    currentOutlineIndex -= 1;
                    updateTresholds();

                    onChangeActiveHeading(currentOutlineIndex);
                } else if (window.scrollY >= highTheshold) {
                    currentOutlineIndex += 1;
                    updateTresholds();

                    onChangeActiveHeading(currentOutlineIndex);
                }
            });
        }, 500);
    }

    async transitionOut() {
        document
            .querySelectorAll(
                ".lindy-page-settings-topright, .lindy-page-settings-pageadjacent"
            )
            .forEach((e) => e.remove());
    }
}
