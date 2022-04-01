import { insertPageSettings } from "../overlay/insert";
import { PageModifier } from "./_interface";

export default class OverlayManager implements PageModifier {
    private domain;
    constructor(domain) {
        this.domain = domain;
    }

    async transitionIn() {
        insertPageSettings(this.domain);
    }

    async transitionOut() {
        document
            .querySelectorAll(
                ".lindy-page-settings-topright, .lindy-page-settings-pageadjacent"
            )
            .forEach((e) => e.remove());
    }
}
