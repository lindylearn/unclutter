import throttle from "lodash/throttle";

import { addArticleToLibrary } from "../../common/api";
import { anonymousLibraryEnabled } from "../../common/featureFlags";
import { LibraryInfo, LibraryState, TopicProgress } from "../../common/schema";
import {
    Article,
    ArticleLink,
    readingProgressFullClamp,
} from "@unclutter/library-components/dist/store/_schema";
import { getLibraryUser } from "../../common/storage";
import {
    getRemoteFeatureFlag,
    ReplicacheProxy,
    reportEventContentScript,
} from "../messaging";
import OverlayManager from "./overlay";
import { PageModifier, trackModifierExecution } from "./_interface";
import { constructGraphData } from "@unclutter/library-components/dist/components/Modal/Graph";
import { getUrlHash } from "@unclutter/library-components/dist/common/url";

@trackModifierExecution
export default class LibraryModifier implements PageModifier {
    private articleUrl: string;
    private articleId: string;
    private overlayManager: OverlayManager;
    private readingProgressSyncIntervalSeconds = 10;

    libraryState: LibraryState = {
        libraryEnabled: false,

        libraryUser: undefined,
        libraryInfo: null,
        userInfo: null,

        showLibrarySignup: false,

        isClustering: false,
        wasAlreadyPresent: false,
        error: false,

        relatedArticles: null,
        graph: null,
        topicProgress: null,
        justCompletedArticle: false,
    };

    constructor(articleUrl: string, overlayManager: OverlayManager) {
        this.articleUrl = articleUrl;
        this.articleId = getUrlHash(articleUrl);
        this.overlayManager = overlayManager;
    }

    async fetchState() {
        // fetch user info
        this.libraryState.libraryUser = await getLibraryUser();
        this.libraryState.userInfo = {
            accountEnabled: false,
            topicsEnabled: false,
        };
        const anonLibraryEnabled = await getRemoteFeatureFlag(
            anonymousLibraryEnabled
        );
        this.libraryState.libraryEnabled =
            this.libraryState.libraryUser || anonLibraryEnabled;

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
            if (this.libraryState.libraryInfo?.topic) {
                this.libraryState.topicProgress =
                    await this.constructTopicProgress(
                        rep,
                        this.libraryState.libraryInfo.topic.id
                    );
            }

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
                this.libraryState.libraryUser
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
                title: this.articleUrl,
                word_count: 13,
                publication_date: null,
                time_added: 1661946067,
                reading_progress: 0,
                topic_id: null,
                is_favorite: false,
            };
            this.libraryState.libraryInfo = {
                article,
            };

            await rep.mutate.putArticleIfNotExists(article);
        }
    }

    private async constructTopicProgress(
        rep: ReplicacheProxy,
        topic_id: string
    ): Promise<TopicProgress> {
        const topicArticles = await rep?.query.listTopicArticles(topic_id);
        if (!topicArticles) {
            return null;
        }

        return {
            articleCount: topicArticles.length,
            completedCount: topicArticles.filter(
                (a) => a.reading_progress >= readingProgressFullClamp
            ).length,
        };
    }

    private async constructArticleGraph(rep: ReplicacheProxy) {
        let start = performance.now();
        let nodes: Article[] = await rep.query.listRecentArticles();
        let links: ArticleLink[] = await rep.query.listArticleLinks();

        [this.libraryState.graph, this.libraryState.topicProgress.linkCount] =
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
        if (readingProgress < this.lastReadingProgress) {
            // track only furthest scroll
            return;
        }

        if (this.libraryState.libraryUser) {
            if (
                readingProgress >= 0.95 &&
                this.libraryState.libraryInfo?.article.reading_progress <
                    readingProgressFullClamp
            ) {
                // just completed this article, immediately update state to show in UI
                this.libraryState.justCompletedArticle = true;
                this.sendProgressUpdate(1.0);
                this.overlayManager.updateLibraryState(this.libraryState);
            } else {
                this.sendProgressUpdateThrottled(readingProgress);
            }
        } else if (
            this.libraryState.showLibrarySignup &&
            readingProgress >= 0.9 &&
            this.lastReadingProgress < 0.9
        ) {
            reportEventContentScript("seeLibrarySignup");
        }

        this.lastReadingProgress = readingProgress;
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

        if (this.libraryState.libraryInfo.article) {
            this.libraryState.libraryInfo.article.reading_progress =
                readingProgress;
        }
        if (this.libraryState.graph) {
            const currentNode = this.libraryState.graph.nodes.find(
                (n) => n.depth === 0
            );
            currentNode.reading_progress = readingProgress;
            currentNode.isCompleted =
                readingProgress >= readingProgressFullClamp;
        }

        const rep = new ReplicacheProxy();
        rep.mutate.updateArticle({
            id: this.articleId,
            reading_progress: readingProgress,
        });
    }
    // throttle to send updates less often, but do during continous reading scroll
    private sendProgressUpdateThrottled = throttle(
        this.sendProgressUpdate.bind(this),
        this.readingProgressSyncIntervalSeconds * 1000
    );
}
