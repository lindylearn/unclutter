import throttle from "lodash/throttle";

import {
    Article,
    ArticleLink,
    readingProgressFullClamp,
} from "@unclutter/library-components/dist/store/_schema";
import { constructGraphData } from "@unclutter/library-components/dist/components/Modal/Graph";
import {
    getWeekStart,
    getUrlHash,
    subtractWeeks,
} from "@unclutter/library-components/dist/common";

import OverlayManager from "./overlay";
import { PageModifier, trackModifierExecution } from "./_interface";
import { getLibraryUser } from "../../common/storage";
import {
    getRemoteFeatureFlag,
    ReplicacheProxy,
    reportEventContentScript,
} from "../messaging";
import { addArticleToLibrary } from "../../common/api";
import { anonymousLibraryEnabled } from "../../common/featureFlags";
import {
    LibraryInfo,
    LibraryState,
    ReadingProgress,
} from "../../common/schema";

@trackModifierExecution
export default class LibraryModifier implements PageModifier {
    private articleUrl: string;
    private articleTitle: string;
    private articleId: string;
    private overlayManager: OverlayManager;
    private readingProgressSyncIntervalSeconds = 10;

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
        overlayManager: OverlayManager
    ) {
        this.articleUrl = articleUrl;
        this.articleTitle = articleTitle;
        this.articleId = getUrlHash(articleUrl);
        this.overlayManager = overlayManager;
    }

    async fetchState() {
        // fetch user info
        const libraryUser = await getLibraryUser();
        if (libraryUser) {
            this.libraryState.libraryEnabled = true;
            this.libraryState.userInfo = {
                id: libraryUser,
                accountEnabled: true,
                topicsEnabled: true,
            };
        } else {
            this.libraryState.libraryEnabled = await getRemoteFeatureFlag(
                anonymousLibraryEnabled
            );
            this.libraryState.userInfo = {
                accountEnabled: false,
                topicsEnabled: false,
            };
        }

        // fetch or create article state
        if (this.libraryState.libraryEnabled) {
            this.overlayManager.updateLibraryState(this.libraryState);
            this.fetchLibraryState();
            return;
        }
    }

    async fetchLibraryState() {
        const rep = new ReplicacheProxy();

        try {
            // get existing library state
            this.libraryState.libraryInfo = await this.getLibraryInfo(
                rep,
                this.articleId
            );

            // handle retrieved state
            if (!this.libraryState.libraryInfo) {
                // run on-demand adding
                this.libraryState.isClustering = true;
                this.overlayManager.updateLibraryState(this.libraryState);

                await this.insertArticle(rep);

                this.libraryState.isClustering = false;
                if (!this.libraryState.libraryInfo) {
                    this.libraryState.error = true;
                }

                reportEventContentScript("addArticle");
            } else {
                // use existing state
                this.libraryState.wasAlreadyPresent = true;

                reportEventContentScript("visitArticle");
            }

            // fetch topic progress stats
            this.lastReadingProgress =
                this.libraryState.libraryInfo.article.reading_progress;
            this.libraryState.readingProgress =
                await this.constructReadingProgress(rep);

            // show in UI
            this.overlayManager.updateLibraryState(this.libraryState);

            // construct article graph from local replicache
            if (
                this.libraryState.userInfo.topicsEnabled &&
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

    private async getLibraryInfo(
        rep: ReplicacheProxy,
        articleId: string
    ): Promise<LibraryInfo> {
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
        if (this.libraryState.userInfo.topicsEnabled) {
            // fetch state remotely
            // TODO remove mutate in backend? just fetch topic?
            this.libraryState.libraryInfo = await addArticleToLibrary(
                this.articleUrl,
                this.libraryState.userInfo.id!
            );

            // insert immediately
            await rep.mutate.putArticleIfNotExists(
                this.libraryState.libraryInfo.article
            );
            await rep.mutate.putTopic(this.libraryState.libraryInfo.topic);
        } else {
            const article = {
                id: this.articleId,
                url: this.articleUrl,
                title: this.articleTitle, // TODO clean in frontend
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
    }

    private async constructReadingProgress(
        rep: ReplicacheProxy
    ): Promise<ReadingProgress> {
        if (this.libraryState.libraryInfo?.topic) {
            const topicArticles = await rep?.query.listTopicArticles(
                this.libraryState.libraryInfo.topic.id
            );
            if (!topicArticles) {
                return null;
            }

            return {
                articleCount: topicArticles.length,
                completedCount: topicArticles.filter(
                    (a) => a.reading_progress >= readingProgressFullClamp
                ).length,
            };
        } else {
            const start = subtractWeeks(getWeekStart(), 3);
            const recentArticles = await rep?.query.listRecentArticles(
                start.getTime()
            );

            return {
                articleCount: recentArticles.length,
                completedCount: recentArticles.filter(
                    (a) => a.reading_progress >= readingProgressFullClamp
                ).length,
            };
        }
    }

    private async constructArticleGraph(rep: ReplicacheProxy) {
        let start = performance.now();
        let nodes: Article[] = await rep.query.listRecentArticles();
        let links: ArticleLink[] = await rep.query.listArticleLinks();

        [this.libraryState.graph, this.libraryState.linkCount] =
            await constructGraphData(
                nodes,
                links,
                this.libraryState.libraryInfo.article.url,
                this.libraryState.libraryInfo.topic
            );

        let duration = performance.now() - start;
        console.log(`Constructed library graph in ${Math.round(duration)}ms`);
    }

    private scrollOnceFetchDone = false;
    scrollToLastReadingPosition() {
        if (!this.libraryState.libraryEnabled) {
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
    async onScrollUpdate(readingProgress: number) {
        if (readingProgress < this.lastReadingProgress) {
            // track only furthest scroll
            return;
        }

        if (this.libraryState.libraryEnabled) {
            if (
                readingProgress >= 0.95 &&
                this.libraryState.libraryInfo?.article.reading_progress <
                    readingProgressFullClamp
            ) {
                // immediately update state to show in UI
                await this.updateReadingProgress(1.0);

                // animate count reduction in LibraryMessage
                const rep = new ReplicacheProxy();
                this.libraryState.readingProgress =
                    await this.constructReadingProgress(rep);
                this.libraryState.justCompletedArticle = true;
                this.overlayManager.updateLibraryState(this.libraryState);
            } else {
                this.updateReadingProgressThrottled(readingProgress);
            }
        } else if (
            this.libraryState.showLibrarySignup &&
            readingProgress >= 0.9 &&
            this.lastReadingProgress < 0.9
        ) {
            reportEventContentScript("seeLibrarySignup");
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

        if (
            !this.libraryState.libraryEnabled ||
            !this.libraryState.libraryInfo.article
        ) {
            return;
        }

        // update class state
        this.libraryState.libraryInfo.article.reading_progress =
            readingProgress;
        if (this.libraryState.graph) {
            const currentNode = this.libraryState.graph.nodes.find(
                (n) => n.depth === 0
            );
            currentNode.reading_progress = readingProgress;
            currentNode.isCompleted =
                readingProgress >= readingProgressFullClamp;
        }

        // update data store
        const diff: Partial<Article> = {
            id: this.articleId,
            reading_progress: readingProgress,
        };
        // de-queue if completed article
        if (readingProgress >= readingProgressFullClamp) {
            diff.is_queued = false;
        }

        const rep = new ReplicacheProxy();
        return rep.mutate.updateArticle(diff as Article);
    }
    // throttle to send updates less often, but do during continous reading scroll
    private updateReadingProgressThrottled = throttle(
        this.updateReadingProgress.bind(this),
        this.readingProgressSyncIntervalSeconds * 1000
    );
}
