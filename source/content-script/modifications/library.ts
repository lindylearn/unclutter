import throttle from "lodash/throttle";

import {
    addArticleToLibrary,
    checkArticleInLibrary,
    updateLibraryArticle,
} from "../../common/api";
import { LibraryState } from "../../common/schema";
import { getLibraryUser } from "../../common/storage";
import OverlayManager from "./overlay";
import { PageModifier, trackModifierExecution } from "./_interface";

@trackModifierExecution
export default class LibraryModifier implements PageModifier {
    private articleUrl: string;
    private overlayManager: OverlayManager;
    private readingProgressSyncIntervalSeconds = 30;

    libraryState: LibraryState = {
        isClustering: false,
        wasAlreadyPresent: false,
        error: false,
    };

    constructor(articleUrl: string, overlayManager: OverlayManager) {
        this.articleUrl = articleUrl;
        this.overlayManager = overlayManager;
    }

    async fetchArticleState() {
        this.libraryState.libraryUser = await getLibraryUser();
        this.overlayManager.updateLibraryState(this.libraryState);

        this.libraryState.libraryInfo = await checkArticleInLibrary(
            this.articleUrl,
            this.libraryState.libraryUser
        );

        if (!this.libraryState.libraryInfo) {
            this.libraryState.isClustering = true;
            this.overlayManager.updateLibraryState(this.libraryState);

            this.libraryState.libraryInfo = await addArticleToLibrary(
                this.articleUrl,
                this.libraryState.libraryUser
            );
            this.overlayManager.updateLibraryState(this.libraryState);
        } else {
            this.libraryState.wasAlreadyPresent = true;
            this.overlayManager.updateLibraryState(this.libraryState);
        }
    }

    private lastReadingProgress: number;
    onScrollUpdate(readingProgress: number) {
        if (!this.libraryState.libraryUser) {
            return;
        }
        this.lastReadingProgress = readingProgress;
        this.sendProgressUpdateThrottled(readingProgress);
    }

    startReadingProgressSync() {
        window.addEventListener("beforeunload", () => {
            this.sendProgressUpdate(this.lastReadingProgress);
        });
    }

    private sendProgressUpdate(readingProgress: number) {
        if (!this.libraryState.libraryUser || !this.libraryState.libraryInfo) {
            return;
        }

        updateLibraryArticle(this.articleUrl, this.libraryState.libraryUser, {
            reading_progress: readingProgress,
        });
    }
    // throttle to send updates less often, but do during continous reading scroll
    private sendProgressUpdateThrottled = throttle(
        this.sendProgressUpdate.bind(this),
        this.readingProgressSyncIntervalSeconds * 1000
    );
}
