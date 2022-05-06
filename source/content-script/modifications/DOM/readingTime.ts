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

        document.addEventListener("scroll", this.scollListener.bind(this));
        this.uninstallScrollListener = () =>
            document.removeEventListener(
                "scroll",
                this.scollListener.bind(this)
            );
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

    async afterTransitionOut() {
        if (this.uninstallScrollListener) {
            this.uninstallScrollListener();
        }
    }
}
