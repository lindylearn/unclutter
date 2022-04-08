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
import { getOutline } from "../overlay/outline/parse";
import { renderOutline } from "../overlay/outline/render";
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
            renderOutline(outline);
        }, 1000);
    }

    async transitionOut() {
        document
            .querySelectorAll(
                ".lindy-page-settings-topright, .lindy-page-settings-pageadjacent"
            )
            .forEach((e) => e.remove());
    }
}
