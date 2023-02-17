import throttle from "lodash/throttle";
import { PageModifier, trackModifierExecution } from "./_interface";
import { getLibraryUser } from "../../common/storage";
import {
    captureActiveTabScreenshot,
    getRemoteFeatureFlag,
    reportEventContentScript,
} from "@unclutter/library-components/dist/common/messaging";
import { ReplicacheProxy } from "@unclutter/library-components/dist/common/replicache";
import { showLibrarySignupFlag } from "../../common/featureFlags";
import type { LibraryInfo, LibraryState } from "../../common/schema";
import { constructLocalArticle } from "@unclutter/library-components/dist/common/util";
import ReadingTimeModifier from "./DOM/readingTime";
import AnnotationsModifier from "./annotations/annotationsModifier";
import { readingProgressFullClamp } from "@unclutter/library-components/dist/store/constants";

@trackModifierExecution
export default class LibraryModifier implements PageModifier {
    private readingProgressSyncIntervalSeconds = 10;

    private articleUrl: string;
    private articleId: string;
    private articleTitle: string;

    private annotationsModifier: AnnotationsModifier;

    libraryStateListeners: ((state: LibraryState) => void)[] = [];
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
    };

    constructor(
        articleUrl: string,
        articleId: string,
        articleTitle: string,
        readingTimeModifier: ReadingTimeModifier,
        annotationsModifier: AnnotationsModifier
    ) {
        this.articleUrl = articleUrl;
        this.articleId = articleId;
        this.articleTitle = articleTitle;
        this.annotationsModifier = annotationsModifier;

        readingTimeModifier.readingTimeLeftListeners.push(this.onScrollUpdate.bind(this));
    }

    // update UI components when library state changes
    private notifyLibraryStateListeners() {
        this.libraryStateListeners.forEach((listener) => listener(this.libraryState));
    }

    async fetchState() {
        const rep = new ReplicacheProxy();

        // trigger background fetch
        rep.pull();

        // fetch user info
        this.libraryState.userInfo = await rep.query.getUserInfo();
        this.libraryState.libraryEnabled = true;
        this.libraryState.showLibrarySignup = await getRemoteFeatureFlag(showLibrarySignupFlag);

        this.notifyLibraryStateListeners();

        // fetch or create article state (even if library UI not enabled)
        this.fetchArticleState(rep);
        // this.fetchFeed(rep);
    }

    async fetchArticleState(rep: ReplicacheProxy) {
        try {
            // get existing library state
            this.libraryState.libraryInfo = await this.getLibraryInfo(rep, this.articleId);

            // add article to library if required
            if (!this.libraryState.libraryInfo) {
                // run on-demand adding
                this.libraryState.isClustering = true;
                this.notifyLibraryStateListeners();

                // immediately create rough local state to allow updates
                this.libraryState.libraryInfo = {
                    article: constructLocalArticle(
                        this.articleUrl,
                        this.articleId,
                        this.articleTitle
                    ),
                };
            } else {
                // use existing state
                this.libraryState.wasAlreadyPresent = true;

                if (this.libraryState.libraryInfo?.article) {
                    await rep.mutate.articleTrackOpened(this.libraryState.libraryInfo.article.id);
                }
            }

            // skip further processing if library disabled or error
            if (!this.libraryState.libraryInfo?.article) {
                this.libraryState.error = true;
            }
            if (!this.libraryState.libraryEnabled || this.libraryState.error) {
                return;
            }

            // subscribe to reading progress updates before mutating data store
            this.lastReadingProgress = this.libraryState.libraryInfo.article.reading_progress;
            rep.subscribe.getReadingProgress()({
                onData: (readingProgress) => {
                    this.libraryState.readingProgress = readingProgress;
                    this.notifyLibraryStateListeners();
                },
            });

            // insert new article (add a delay to animate reading progress)
            if (!this.libraryState.wasAlreadyPresent) {
                await rep.mutate.putArticleIfNotExists(this.libraryState.libraryInfo.article);
            }

            // subscribe to article updates after insert
            rep.subscribe.getArticle(this.libraryState.libraryInfo.article.id)({
                onData: (article) => {
                    if (article) {
                        this.libraryState.libraryInfo.article = article;
                        this.notifyLibraryStateListeners();
                    }
                },
            });

            // if (this.scrollOnceFetchDone) {
            //     this.scrollToLastReadingPosition();
            // }

            // report library events
            if (this.libraryState.wasAlreadyPresent) {
                reportEventContentScript("visitArticle");
            } else {
                reportEventContentScript("addArticle");
            }
        } catch (err) {
            this.libraryState.error = true;
            this.notifyLibraryStateListeners();
            console.error(err);
        }
    }

    // private async fetchFeed(rep: ReplicacheProxy) {
    //     try {
    //         // parse DOM
    //         // TODO move to different phase?

    //         // TODO consider tagged feeds
    //         const subscriptions = await rep.query.getDomainSubscriptions(
    //             getDomain(this.articleUrl)
    //         );

    //         if (subscriptions.length > 0) {
    //             // already parsed before
    //             this.libraryState.feed = subscriptions[0];
    //         } else {
    //             // fetch & parse feed in background
    //             const feedUrls = await discoverFeedsInDocument(document, this.articleUrl);

    //             this.libraryState.feed = await browser.runtime.sendMessage(null, {
    //                 event: "discoverRssFeed",
    //                 sourceUrl: this.articleUrl,
    //                 feedCandidates: feedUrls,
    //                 tagLinkCandidates: extractTags(document, this.articleUrl),
    //             });
    //             if (this.libraryState.feed) {
    //                 // detailed fetching in background may discover more potentially existing feeds
    //                 const existing = await rep.query.getSubscription(this.libraryState.feed.id);
    //                 if (!existing) {
    //                     // insert even if not subscribed
    //                     await rep.mutate.putSubscription(this.libraryState.feed);
    //                 }
    //             }
    //         }

    //         if (this.libraryState.feed) {
    //             // subscribe to feed updates
    //             rep.subscribe.getSubscription(this.libraryState.feed.id)({
    //                 onData: (feed) => {
    //                     if (feed) {
    //                         this.libraryState.feed = feed;
    //                         this.notifyLibraryStateListeners();
    //                     }
    //                 },
    //             });

    //             this.libraryState.showFeed = true;
    //         }

    //         this.notifyLibraryStateListeners();
    //     } catch (err) {
    //         console.error(err);
    //     }
    // }

    private async getLibraryInfo(rep: ReplicacheProxy, articleId: string): Promise<LibraryInfo> {
        const article = await rep.query.getArticle(articleId);
        if (!article) {
            return null;
        }

        return {
            article,
        };
    }

    // called from transitions.ts, or again internally once fetch done
    private scrollOnceFetchDone = false;
    scrollToLastReadingPosition() {
        if (!this.libraryState.libraryEnabled || this.annotationsModifier.focusedAnnotation) {
            return;
        }

        if (!this.libraryState.libraryInfo) {
            this.scrollOnceFetchDone = true;
            return;
        }

        // skip scroll for completed articles
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
            // immediately update state to show change in UI
            await this.updateReadingProgress(1.0);
            reportEventContentScript("completeArticle", { source: "scroll" });
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

        // update local graph state
        if (this.libraryState.graph) {
            const currentNode = this.libraryState.graph.nodes.find((n) => n.depth === 0);
            if (currentNode) {
                currentNode.reading_progress = readingProgress;
                currentNode.isCompleted = readingProgress >= readingProgressFullClamp;
            } else {
                console.error("Could not find active node in graph");
            }
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
        // if (this.libraryState.userInfo?.accountEnabled) {
        //     // can use remote screenshot fetch
        //     return;
        // }

        if (this.libraryState?.wasAlreadyPresent) {
            return;
        }

        // run in background
        const bodyRect = document.body.getBoundingClientRect();
        captureActiveTabScreenshot(this.articleId, bodyRect, window.devicePixelRatio);
    }

    toggleArticleInQueue() {
        if (!this.libraryState.libraryInfo.article) {
            return;
        }

        const rep = new ReplicacheProxy();
        rep?.mutate.articleAddMoveToQueue({
            articleId: this.libraryState.libraryInfo.article.id,
            isQueued: !this.libraryState.libraryInfo.article.is_queued,
            // add to front of queue
            articleIdBeforeNewPosition: null,
            articleIdAfterNewPosition: null,
            sortPosition: "queue_sort_position",
        });
        if (!this.libraryState.libraryInfo.article.is_queued) {
            reportEventContentScript("addArticleToQueue", { source: "message" });
        }
    }

    toggleFeedSubscribed() {
        if (!this.libraryState.feed) {
            return;
        }

        const rep = new ReplicacheProxy();
        rep.mutate.toggleSubscriptionActive(this.libraryState.feed.id);
        reportEventContentScript(
            !this.libraryState.feed.is_subscribed ? "followFeed" : "unfollowFeed",
            {
                source: "message",
                feedFrequencyWeek: this.libraryState.feed.post_frequency?.per_week,
            }
        );
    }
}
