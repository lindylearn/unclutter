import throttle from "lodash/throttle";
import OverlayManager from "../overlay";
import { PageModifier, trackModifierExecution } from "../_interface";

/*
    Calculate the reading time for the article, and update it based on the page scroll.
*/
@trackModifierExecution
export default class ReadingTimeModifier implements PageModifier {
    private wpm = 200;
    private totalReadingTime: number = null;

    private overlayManager: OverlayManager;

    constructor(overlayManager: OverlayManager) {
        this.overlayManager = overlayManager;
    }

    private uninstallScrollListener: () => void;
    async afterTransitionIn() {
        // getting all text is fine since we block most non-text elements?
        const wordCount = document.body.innerText.trim().split(/\s+/).length;

        this.totalReadingTime = Math.round(wordCount / this.wpm);
        this.overlayManager.updateReadingTimeLeft(this.totalReadingTime);

        // Don't re-render outline on every scroll update (might trigger <100ms)
        // throttle instead of debounce to update during continous scrolls
        const scrollListenerThrottled = throttle(
            this.scollListener.bind(this),
            200
        );
        document.addEventListener("scroll", scrollListenerThrottled);
        this.uninstallScrollListener = () =>
            document.removeEventListener("scroll", scrollListenerThrottled);
    }

    // todo throttle?
    private scollListener() {
        // take start of viewport offseet, so will never reach 100%
        const pageProgress =
            window.scrollY / document.documentElement.scrollHeight;

        // TODO base on outline headings to be more robust against whitespace?
        const readingTimeLeft = Math.round(
            this.totalReadingTime * (1 - pageProgress)
        );
        this.overlayManager.updateReadingTimeLeft(readingTimeLeft);
    }

    async beforeTransitionOut() {
        if (this.uninstallScrollListener) {
            this.uninstallScrollListener();
        }
    }
}
