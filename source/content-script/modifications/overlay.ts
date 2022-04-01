import { insertPageSettings } from "../overlay/insert";
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

    async transitionIn() {
        insertPageSettings(this.domain, this.themeModifier);
    }

    async transitionOut() {
        document
            .querySelectorAll(
                ".lindy-page-settings-topright, .lindy-page-settings-pageadjacent"
            )
            .forEach((e) => e.remove());
    }
}
