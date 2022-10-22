import throttle from "lodash/throttle";

import {
    Article,
    ArticleLink,
    readingProgressFullClamp,
} from "@unclutter/library-components/dist/store/_schema";
import { constructGraphData } from "@unclutter/library-components/dist/components/Modal/Graph";
import { getWeekStart, getUrlHash, subtractWeeks } from "@unclutter/library-components/dist/common";

import OverlayManager from "./overlay";
import { PageModifier, trackModifierExecution } from "./_interface";
import { getLibraryUser } from "../../common/storage";
import {
    captureActiveTabScreenshot,
    getRemoteFeatureFlag,
    ReplicacheProxy,
    reportEventContentScript,
} from "@unclutter/library-components/dist/common/messaging";
import { addArticleToLibrary } from "../../common/api";
import { anonymousLibraryEnabled, showLibrarySignupFlag } from "../../common/featureFlags";
import { LibraryInfo, LibraryState, ReadingProgress } from "../../common/schema";
import ReadingTimeModifier from "./DOM/readingTime";
import { cleanTitle } from "../../overlay/outline/components/parse";

@trackModifierExecution
export default class LibraryModifier implements PageModifier {
    private readingProgressSyncIntervalSeconds = 10;

    private articleUrl: string;
    private articleTitle: string;
    private articleId: string;

    private overlayManager: OverlayManager;

    libraryState: LibraryState = {
        libraryEnabled: false,

        libraryInfo: null,
        userInfo: null,

        showLibrarySignup: false,

        isClustering: false,
        wasAlreadyPresent: false,
        error: false,

        relatedArticles: null,
        graph: null,
        linkCount: null,
        readingProgress: null,
        justCompletedArticle: false,
    };

    constructor(
        articleUrl: string,
        articleTitle: string,
        overlayManager: OverlayManager,
        readingTimeModifier: ReadingTimeModifier
    ) {
        this.articleUrl = articleUrl;
        this.articleTitle = articleTitle;
        this.articleId = getUrlHash(articleUrl);
        this.overlayManager = overlayManager;

        readingTimeModifier.readingTimeLeftListeners.push(this.onScrollUpdate.bind(this));
    }

    async fetchState() {
        const rep = new ReplicacheProxy();

        // fetch user info
        const libraryUser = await getLibraryUser();
        if (libraryUser) {
            // user with account
            this.libraryState.libraryEnabled = true;
            this.libraryState.userInfo = await rep.query.getUserInfo();
        } else {
            this.libraryState.libraryEnabled = await getRemoteFeatureFlag(anonymousLibraryEnabled);
            this.libraryState.showLibrarySignup = await getRemoteFeatureFlag(showLibrarySignupFlag);
            this.libraryState.userInfo = {
                id: null,
                email: null,
                signinProvider: null,
                accountEnabled: false,
                onPaidPlan: false,
            };
        }

        // fetch or create article state (even if library UI not enabled)
        this.overlayManager.updateLibraryState(this.libraryState);
        this.fetchArticleState(rep);
    }

    async fetchArticleState(rep: ReplicacheProxy) {
        try {
            // get existing library state
            this.libraryState.libraryInfo = await this.getLibraryInfo(rep, this.articleId);
            if (!this.libraryState.libraryInfo) {
                // run on-demand adding
                this.libraryState.isClustering = true;
                this.overlayManager.updateLibraryState(this.libraryState);

                await this.insertArticle(rep);

                this.libraryState.isClustering = false;
                if (!this.libraryState.libraryInfo) {
                    this.libraryState.error = true;
                }
            } else {
                // use existing state
                this.libraryState.wasAlreadyPresent = true;
            }

            // skip further processing if library disabled
            if (!this.libraryState.libraryEnabled) {
                return;
            }

            // report library events
            if (this.libraryState.wasAlreadyPresent) {
                reportEventContentScript("visitArticle");
            } else {
                reportEventContentScript("addArticle");
            }

            // fetch topic progress stats
            this.lastReadingProgress = this.libraryState.libraryInfo.article.reading_progress;
            this.libraryState.readingProgress = await rep.query.getReadingProgress(
                this.libraryState.libraryInfo.topic?.id
            );

            // show in UI
            this.overlayManager.updateLibraryState(this.libraryState);

            // construct article graph from local replicache
            if (
                (this.libraryState.userInfo?.onPaidPlan ||
                    this.libraryState.userInfo?.trialEnabled) &&
                this.libraryState.libraryInfo
            ) {
                await this.constructArticleGraph(rep);
                this.overlayManager.updateLibraryState(this.libraryState);
            }

            if (this.scrollOnceFetchDone) {
                this.scrollToLastReadingPosition();
            }
        } catch (err) {
            this.libraryState.error = true;
            this.overlayManager.updateLibraryState(this.libraryState);
            console.error(err);
        }
    }

    private async getLibraryInfo(rep: ReplicacheProxy, articleId: string): Promise<LibraryInfo> {
        const article = await rep.query.getArticle(articleId);
        if (!article) {
            return null;
        }

        const topic = await rep.query.getTopic(article.topic_id);
        return {
            article,
            topic,
        };
    }

    private async insertArticle(rep: ReplicacheProxy) {
        if (this.libraryState.userInfo.onPaidPlan || this.libraryState.userInfo.trialEnabled) {
            // fetch state remotely
            // TODO remove mutate in backend? just fetch topic?
            this.libraryState.libraryInfo = await addArticleToLibrary(
                this.articleUrl,
                this.libraryState.userInfo.id!
            );

            // insert immediately
            await rep.mutate.putArticleIfNotExists(this.libraryState.libraryInfo.article);
            await rep.mutate.putTopic(this.libraryState.libraryInfo.topic);
        } else {
            const article = {
                id: this.articleId,
                url: this.articleUrl,
                title: cleanTitle(this.articleTitle),
                word_count: 0, // TODO how to get this in frontend?
                publication_date: null, // TODO how to get this in frontend?
                time_added: new Date().getTime() / 1000,
                reading_progress: this.lastReadingProgress || 0.0,
                topic_id: null,
                is_favorite: false,
            };
            this.libraryState.libraryInfo = {
                article,
            };

            await rep.mutate.putArticleIfNotExists(article);
        }

        if (this.libraryState.libraryInfo?.article) {
            await rep.mutate.articleTrackOpened(this.libraryState.libraryInfo.article.id);
        }
    }

    private async constructArticleGraph(rep: ReplicacheProxy) {
        let start = performance.now();
        let nodes: Article[] = await rep.query.listRecentArticles();
        let links: ArticleLink[] = await rep.query.listArticleLinks();

        [this.libraryState.graph, this.libraryState.linkCount] = await constructGraphData(
            nodes,
            links,
            this.libraryState.libraryInfo.article.url,
            this.libraryState.libraryInfo.topic
        );

        let duration = performance.now() - start;
        console.log(`Constructed library graph in ${Math.round(duration)}ms`);
    }

    // called from transitions.ts, or again internally once fetch done
    private scrollOnceFetchDone = false;
    scrollToLastReadingPosition() {
        if (!this.libraryState.libraryEnabled) {
            return;
        }
        if (!this.libraryState.libraryInfo) {
            this.scrollOnceFetchDone = true;
            return;
        }

        const readingProgress = this.libraryState.libraryInfo.article.reading_progress;
        if (!this.libraryState.wasAlreadyPresent || !readingProgress || readingProgress >= 0.8) {
            return;
        }

        window.scrollTo({
            top: readingProgress * document.body.scrollHeight - window.innerHeight,
            behavior: "smooth",
        });
    }

    private lastReadingProgress: number;
    async onScrollUpdate(pageProgress: number, readingTimeLeft: number) {
        if (pageProgress < this.lastReadingProgress) {
            // track only furthest scroll
            return;
        }

        if (
            pageProgress >= 0.99 &&
            this.libraryState.libraryInfo?.article &&
            this.libraryState.libraryInfo.article.reading_progress < readingProgressFullClamp
        ) {
            // immediately update state to show in UI
            await this.updateReadingProgress(1.0);

            // animate count reduction in LibraryMessage
            const rep = new ReplicacheProxy();
            this.libraryState.readingProgress = await rep.query.getReadingProgress(
                this.libraryState.libraryInfo.topic?.id
            );
            this.libraryState.justCompletedArticle = true;
            this.overlayManager.updateLibraryState(this.libraryState);
        } else {
            this.updateReadingProgressThrottled(pageProgress);
        }
    }

    startReadingProgressSync() {
        // shortly before leaving page
        window.addEventListener("beforeunload", () => {
            this.updateReadingProgress(this.lastReadingProgress);
        });
        // when interacting with unclutter UI (e.g. opening the modal)
        window.addEventListener("blur", () => {
            this.updateReadingProgress(this.lastReadingProgress);
        });
    }

    // can be called sync (to execute on beforeunload), or await result if need mutation to be complete
    private updateReadingProgress(readingProgress: number = 0.0) {
        if (readingProgress <= this.lastReadingProgress) {
            // track only furthest scroll
            return;
        }
        this.lastReadingProgress = readingProgress;

        if (!this.libraryState.libraryInfo?.article) {
            return;
        }

        // update class state
        this.libraryState.libraryInfo.article.reading_progress = readingProgress;
        if (this.libraryState.graph) {
            const currentNode = this.libraryState.graph.nodes.find((n) => n.depth === 0);
            currentNode.reading_progress = readingProgress;
            currentNode.isCompleted = readingProgress >= readingProgressFullClamp;
        }

        // update data store
        const rep = new ReplicacheProxy();
        return rep.mutate.updateArticleReadingProgress({
            articleId: this.articleId,
            readingProgress,
        });
    }
    // throttle to send updates less often, but do during continous reading scroll
    private updateReadingProgressThrottled = throttle(
        this.updateReadingProgress.bind(this),
        this.readingProgressSyncIntervalSeconds * 1000
    );

    // capture a screenshot of the current article page to display as thumbnail inside the library UI
    captureScreenshot() {
        if (this.libraryState.userInfo.accountEnabled) {
            // can use remote screenshot fetch
            return;
        }

        // run in background
        const bodyRect = document.body.getBoundingClientRect();
        captureActiveTabScreenshot(this.articleId, bodyRect, window.devicePixelRatio);
    }
}
