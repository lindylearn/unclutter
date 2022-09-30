import LibraryModalModifier from "./libraryModal";
import { PageModifier, trackModifierExecution } from "./_interface";

@trackModifierExecution
export default class KeyboardModifier implements PageModifier {
    private libraryModalModifier: LibraryModalModifier;

    constructor(libraryModalModifier: LibraryModalModifier) {
        this.libraryModalModifier = libraryModalModifier;
    }

    private eventListener;
    observeShortcuts() {
        this.eventListener = (e: KeyboardEvent) => {
            if (e.key === "Tab") {
                this.libraryModalModifier.toggleModal();
                e.preventDefault();
            }
        };
        window.addEventListener("keydown", this.eventListener);
    }

    unObserveShortcuts() {
        window.removeEventListener("keydown", this.eventListener);
    }
}
