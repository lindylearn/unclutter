import { getBrowserType } from "../../common/polyfill";
import { LibraryState } from "../../common/schema";
import { createIframeNode, insertIframeFont } from "./overlay";
import { PageModifier, trackModifierExecution } from "./_interface";
import GraphModalSvelte from "../../overlay/modal/GraphModal.svelte";
import { backgroundColorThemeVariable } from "../../common/theme";
import ThemeModifier from "./CSSOM/theme";

@trackModifierExecution
export default class GraphModalModifier implements PageModifier {
    private themeModifier: ThemeModifier;
    constructor(themeModifier: ThemeModifier) {
        this.themeModifier = themeModifier;
    }

    private modalIframe: HTMLIFrameElement;
    private modalSvelteComponent: GraphModalSvelte;
    async showModal() {
        // create iframe only when enabled
        this.modalIframe = createIframeNode("lindy-graph-modal");
        this.modalIframe.style.position = "fixed"; // put on new layer
        document.documentElement.appendChild(this.modalIframe);
        insertIframeFont(this.modalIframe);

        // insert font
        if (getBrowserType() === "firefox") {
            // wait until iframe rendered
            // TODO attach listener instead of static wait?
            await new Promise((r) => setTimeout(r, 10));
        }
        this.modalIframe.contentDocument.body.style.setProperty(
            backgroundColorThemeVariable,
            this.themeModifier.backgroundColor
        );

        // render svelte
        this.modalSvelteComponent = new GraphModalSvelte({
            target: this.modalIframe.contentDocument.body,
            props: {
                graphModalModifier: this,
                libraryState: this.libraryState,
            },
        });
    }

    closeModal() {
        console.log("close");
        this.modalSvelteComponent?.$destroy();
        this.modalSvelteComponent = null;
        this.modalIframe?.remove();
        this.modalIframe = null;
    }

    private libraryState: LibraryState = null;
    // updateLibraryState(libraryState: LibraryState) {
    //     this.libraryState = libraryState;

    //     this.modalSvelteComponent?.$set({
    //         libraryState,
    //     });
    // }
}
