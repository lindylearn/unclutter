import { reportEventContentScript } from "@unclutter/library-components/dist/common";
import ReadingTimeModifier from "./DOM/readingTime";
import LibraryModifier from "./library";
import OverlayManager from "./overlay";
import { trackModifierExecution } from "./_interface";

@trackModifierExecution
export default class LoggingManager implements PageModifier {
    private domain: string;
    private overlayManager: OverlayManager;
    private readingTimeModifier: ReadingTimeModifier;
    private libraryModifier: LibraryModifier;

    constructor(
        domain: string,
        overlayManager: OverlayManager,
        readingTimeModifier: ReadingTimeModifier,
        libraryModifier: LibraryModifier
    ) {
        this.domain = domain;
        this.overlayManager = overlayManager;
        this.readingTimeModifier = readingTimeModifier;
        this.libraryModifier = libraryModifier;
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
            outlineVisible: window.innerWidth > 1200,
            outlineItems: this.overlayManager.outline.length,
            readingTime: this.readingTimeModifier.totalReadingTime,
            foundFeed: !!this.libraryModifier.libraryState.feed,
            feedFrequencyWeek: this.libraryModifier.libraryState.feed?.post_frequency?.per_week,
            domain: this.domain,
        });
    }
}
