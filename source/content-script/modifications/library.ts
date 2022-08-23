import throttle from "lodash/throttle";

import {
    addArticleToLibrary,
    checkArticleInLibrary,
    updateLibraryArticle,
} from "../../common/api";
import { LibraryState } from "../../common/schema";
import { getLibraryUser } from "../../common/storage";
import { reportEventContentScript } from "../messaging";
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
        try {
            // get extension settings
            this.libraryState.libraryUser = await getLibraryUser();
            if (!this.libraryState.libraryUser) {
                return;
            }
            this.overlayManager.updateLibraryState(this.libraryState);

            // get library state
            this.libraryState.libraryInfo = await checkArticleInLibrary(
                this.articleUrl,
                this.libraryState.libraryUser
            );

            if (!this.libraryState.libraryInfo) {
                // run on-demand adding
                this.libraryState.isClustering = true;
                this.overlayManager.updateLibraryState(this.libraryState);

                this.libraryState.libraryInfo = await addArticleToLibrary(
                    this.articleUrl,
                    this.libraryState.libraryUser
                );
                if (!this.libraryState.libraryInfo) {
                    this.libraryState.error = true;
                }
                this.overlayManager.updateLibraryState(this.libraryState);

                reportEventContentScript("addArticle", {
                    libraryUser: this.libraryState.libraryUser,
                });
            } else {
                // show retrieved state
                this.libraryState.wasAlreadyPresent = true;
                this.overlayManager.updateLibraryState(this.libraryState);

                reportEventContentScript("visitArticle", {
                    libraryUser: this.libraryState.libraryUser,
                });
            }

            if (this.scrollOnceFetchDone) {
                this.scrollToLastReadingPosition();
            }
        } catch {
            this.libraryState.error = true;
            this.overlayManager.updateLibraryState(this.libraryState);
        }
    }

    private scrollOnceFetchDone = false;
    scrollToLastReadingPosition() {
        if (!this.libraryState.libraryUser) {
            return;
        }
        if (!this.libraryState.libraryInfo) {
            this.scrollOnceFetchDone = true;
            return;
        }

        const readingProgress =
            this.libraryState.libraryInfo.article.reading_progress;
        if (
            !this.libraryState.wasAlreadyPresent ||
            !readingProgress ||
            readingProgress >= 0.8
        ) {
            return;
        }

        window.scrollTo({
            top:
                readingProgress * document.body.scrollHeight -
                window.innerHeight,
            behavior: "smooth",
        });
    }

    private lastReadingProgress: number;
    onScrollUpdate(readingProgress: number) {
        if (!this.libraryState.libraryUser) {
            return;
        }
        if (readingProgress < this.lastReadingProgress) {
            // track only furthest scroll
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
