import throttle from "lodash/throttle";
import browser from "../../common/polyfill";

import {
    addArticleToLibrary,
    checkArticleInLibrary,
    updateLibraryArticle,
} from "../../common/api";
import { showLibrarySignupFlag } from "../../common/featureFlags";
import { LibraryState, TopicProgress } from "../../common/schema";
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

@trackModifierExecution
export default class LibraryModifier implements PageModifier {
    private articleUrl: string;
    private overlayManager: OverlayManager;
    private readingProgressSyncIntervalSeconds = 10;

    libraryState: LibraryState = {
        libraryUser: undefined,
        libraryInfo: null,

        showLibrarySignup: false,

        isClustering: false,
        wasAlreadyPresent: false,
        error: false,

        relatedArticles: null,
        graph: null,
        topicProgress: null,
    };

    constructor(articleUrl: string, overlayManager: OverlayManager) {
        this.articleUrl = articleUrl;
        this.overlayManager = overlayManager;
    }

    async fetchState() {
        this.libraryState.libraryUser = await getLibraryUser();
        if (this.libraryState.libraryUser) {
            this.overlayManager.updateLibraryState(this.libraryState);
            this.fetchLibraryState();
            return;
        }

        this.libraryState.showLibrarySignup = await getRemoteFeatureFlag(
            showLibrarySignupFlag
        );
        if (this.libraryState.showLibrarySignup) {
            this.overlayManager.updateLibraryState(this.libraryState);
            this.fetchSignupArticles();
            return;
        }
    }

    async fetchLibraryState() {
        const rep = new ReplicacheProxy();

        try {
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
                this.libraryState.isClustering = false;
                if (!this.libraryState.libraryInfo) {
                    this.libraryState.error = true;
                }

                reportEventContentScript("addArticle", {
                    libraryUser: this.libraryState.libraryUser,
                });
            } else {
                // show retrieved state
                this.libraryState.wasAlreadyPresent = true;

                reportEventContentScript("visitArticle", {
                    libraryUser: this.libraryState.libraryUser,
                });
            }

            // fetch topic progress stats
            if (this.libraryState.libraryInfo) {
                this.libraryState.topicProgress =
                    await this.constructTopicProgress(
                        rep,
                        this.libraryState.libraryInfo.topic.id
                    );
            }

            // show in UI
            this.overlayManager.updateLibraryState(this.libraryState);

            // construct article graph from local replicache
            if (this.libraryState.libraryInfo) {
                let nodes: Article[] = await rep.query.listRecentArticles();
                let links: ArticleLink[] = await rep.query.listArticleLinks();

                if (!this.libraryState.wasAlreadyPresent) {
                    // use new node and links immediately
                    nodes = nodes.concat([
                        this.libraryState.libraryInfo.article,
                    ]);
                    links = links.concat(
                        this.libraryState.libraryInfo.new_links || []
                    );
                }

                this.libraryState.graph = await constructGraphData(
                    nodes,
                    links,
                    this.libraryState.libraryInfo.article.url,
                    this.libraryState.libraryInfo.topic
                );
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

        // old individual articles fetch
        // this.libraryState.relatedArticles = await getRelatedArticles(
        //     this.articleUrl,
        //     this.libraryState.libraryUser
        // );
        // if (this.libraryState.relatedArticles.length === 0) {
        //     console.error("No related articles found");
        // }
        // this.overlayManager.updateLibraryState(this.libraryState);
    }

    async fetchSignupArticles() {
        // try {
        //     this.libraryState.relatedArticles = await getRelatedArticles(
        //         this.articleUrl,
        //         "e2318252-3ff0-4345-9283-56597525e099"
        //     );
        // } catch {
        //     this.libraryState.relatedArticles = [];
        // }
        this.libraryState.relatedArticles = [];

        // fill missing slots with static articles
        this.libraryState.relatedArticles =
            this.libraryState.relatedArticles.concat(
                librarySignupStaticArticles
            );

        this.overlayManager.updateLibraryState(this.libraryState);
    }

    private async constructTopicProgress(
        rep: ReplicacheProxy,
        topic_id: string
    ): Promise<TopicProgress> {
        const topicArticles = await rep?.query.listTopicArticles(topic_id);
        if (!this.libraryState.wasAlreadyPresent) {
            // likely not pulled from replicache yet
            topicArticles.push(this.libraryState.libraryInfo.article);
        }

        return {
            articleCount: topicArticles.length,
            completedCount: topicArticles.filter(
                (a) => a.reading_progress >= readingProgressFullClamp
            ).length,
        };
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
            this.sendProgressUpdateThrottled(readingProgress);
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

const librarySignupStaticArticles: Article[] = [
    {
        id: "21d298cc3c10aae89d9507eb5f7e6ffb98c263a3c345b5e6442f3aea32015a79",
        url: "https://bigthink.com/neuropsych/do-i-own-too-many-books/",
        title: "The value of owning more books than you can read - Big Think",
        word_count: 13,
        publication_date: null,
        time_added: 1661946067,
        reading_progress: 0,
        topic_id: "7_",
        is_favorite: false,
    },
    {
        id: "732814a768b75aecfc665bd75fba6530704fae3264b95d6363953460b6230aa4",
        url: "https://fs.blog/too-busy/",
        title: "Too Busy to Pay Attention - Farnam Street",
        word_count: 1501,
        publication_date: null,
        time_added: 1661945871,
        reading_progress: 0,
        topic_id: "-23_",
        is_favorite: false,
    },
    {
        id: "83c366a3ad7f968b2a54677f27e5d15d78250753bacff18413a8846f3e05bb18",
        url: "https://www.theatlantic.com/science/archive/2019/07/we-need-new-science-progress/594946/",
        title: "We Need a New Science of Progress - The Atlantic",
        word_count: 2054,
        publication_date: null,
        time_added: null,
        reading_progress: 0,
        topic_id: "5_",
        is_favorite: false,
        topic_sort_position: 0,
    },
];
