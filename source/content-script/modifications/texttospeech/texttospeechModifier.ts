import { trackModifierExecution } from "../_interface";
import { globalTextElementSelector, lindyTextContainerClass } from "../DOM/textContainer"

@trackModifierExecution
export default class TextToSpeechModifier {
    private speech: SpeechSynthesisUtterance;
    private textElementSelector = `.${lindyTextContainerClass}, .${lindyTextContainerClass} > :is(${globalTextElementSelector}, a, ol)`;

    enableTextToSpeech() {
			this.speech = new SpeechSynthesisUtterance();

			const article = document.querySelector(this.textElementSelector) as HTMLElement | null;

			this.speech.lang = navigator.language;
			this.speech.voice = window.speechSynthesis.getVoices()[0];
			this.speech.text = 'From ' + document.location.hostname + '. ' + article.innerText;

			window.speechSynthesis.speak(this.speech);
    }

    disableTextToSpeech() {
			window.speechSynthesis.cancel();
    }

    setEnableTextToSpeech(enableTextToSpeech: boolean) {
        if (enableTextToSpeech) {
            this.enableTextToSpeech();
        } else {
            this.disableTextToSpeech();
        }
    }
}