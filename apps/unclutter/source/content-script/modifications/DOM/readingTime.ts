import throttle from "lodash/throttle";
import BodyStyleModifier from "../bodyStyle";
import { PageModifier, trackModifierExecution } from "../_interface";

/*
    Calculate the reading time for the article, and update it based on the page scroll.
*/
@trackModifierExecution
export default class ReadingTimeModifier implements PageModifier {
    private wpm = 200;

    private bodyStyleModifier: BodyStyleModifier;

    totalReadingTime: number = null;
    pageProgress: number;
    readingTimeLeftListeners: ((pageProgress: number, readingTimeLeft: number) => void)[] = [];
    likelyMainTextMissing: boolean;

    constructor(bodyStyleModifier: BodyStyleModifier) {
        this.bodyStyleModifier = bodyStyleModifier;
    }

    private uninstallScrollListener: () => void;
    async afterTransitionIn() {
        // getting all text is fine since we block most non-text elements?
        const wordCount = document.body.innerText.trim().split(/\s+/).length;
        this.totalReadingTime = Math.round(wordCount / this.wpm);

        this.likelyMainTextMissing = document.body.scrollHeight < 1000;

        // Don't re-render outline on every scroll update (might trigger <100ms)
        // throttle instead of debounce to update during continous scrolls
        const scrollListenerThrottled = throttle(this.scollListener.bind(this), 200);
        document.addEventListener("scroll", scrollListenerThrottled);
        this.uninstallScrollListener = () =>
            document.removeEventListener("scroll", scrollListenerThrottled);

        // call with initial values
        this.scollListener();
    }

    // todo throttle?
    private scollListener() {
        if (this.bodyStyleModifier.scrollLockEnabled) {
            return;
        }

        // viewport bottom
        this.pageProgress =
            (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
        const readingTimeLeft = Math.round(this.totalReadingTime * (1 - this.pageProgress));

        this.readingTimeLeftListeners.forEach((listener) =>
            listener(this.pageProgress, readingTimeLeft)
        );
    }

    async beforeTransitionOut() {
        if (this.uninstallScrollListener) {
            this.uninstallScrollListener();
        }
    }
}
