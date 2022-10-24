import { reportEventContentScript } from "@unclutter/library-components/dist/common";
import ReadingTimeModifier from "./DOM/readingTime";
import OverlayManager from "./overlay";
import { trackModifierExecution } from "./_interface";

@trackModifierExecution
export default class LoggingManager implements PageModifier {
    private overlayManager: OverlayManager;
    private readingTimeModifier: ReadingTimeModifier;

    constructor(overlayManager: OverlayManager, readingTimeModifier: ReadingTimeModifier) {
        this.overlayManager = overlayManager;
        this.readingTimeModifier = readingTimeModifier;
    }

    private start: number;
    prepare() {
        this.start = performance.now();
    }

    // log page properties for feature diagnostics
    afterTransitionInDone() {
        const enableMs = Math.round(performance.now() - this.start);
        reportEventContentScript("logPageviewProperties", {
            enableMs,
            outlineVisible: window.innerWidth > 1300,
            outlineItems: this.overlayManager.outline.length,
            readingTime: this.readingTimeModifier.totalReadingTime,
        });
    }
}
