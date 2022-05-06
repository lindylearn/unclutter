import OverlayManager from "../overlay";
import { PageModifier, trackModifierExecution } from "../_interface";

/*

*/
@trackModifierExecution
export default class ReadingTimeModifier implements PageModifier {
    private wpm = 200;

    private overlayManager: OverlayManager;

    constructor(overlayManager: OverlayManager) {
        this.overlayManager = overlayManager;
    }

    async afterTransitionIn() {
        // getting all text is fine since we block distractions?
        const wordCount = document.body.innerText.trim().split(/\s+/).length;

        const readingTime = Math.round(wordCount / this.wpm);
        this.overlayManager.updateReadingTimeLeft(readingTime);
    }
}
