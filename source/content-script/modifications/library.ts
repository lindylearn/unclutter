import throttle from "lodash/throttle";
import browser from "../../common/polyfill";

import {
    addArticleToLibrary,
    checkArticleInLibrary,
    getArticleGraph,
    getRelatedArticles,
    updateLibraryArticle,
} from "../../common/api";
import { showLibrarySignupFlag } from "../../common/featureFlags";
import { LibraryArticle, LibraryState } from "../../common/schema";
import { getLibraryUser } from "../../common/storage";
import {
    getRemoteFeatureFlag,
    processReplicacheAccessor,
    reportEventContentScript,
} from "../messaging";
import OverlayManager from "./overlay";
import { PageModifier, trackModifierExecution } from "./_interface";
import { GraphData } from "force-graph";
import { ArticleLink } from "../../library-store";

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
        try {
            // get library state
            this.libraryState.libraryInfo = await checkArticleInLibrary(
                this.articleUrl,
                this.libraryState.libraryUser
            );

            // fetch article graph in parallel to clustering
            // getArticleGraph(
            //     this.articleUrl,
            //     this.libraryState.libraryUser
            // )
            this.getFullGraphData().then((graph) => {
                this.libraryState.graph = graph;
                this.overlayManager.updateLibraryState(this.libraryState);
            });

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

    private async getFullGraphData(): Promise<GraphData> {
        const start = new Date();
        start.setDate(start.getDate() - 90);

        let nodes = await processReplicacheAccessor("listRecentArticles", [
            start,
        ]);
        // let nodes = await processReplicacheAccessor("listArticles");
        let links = await processReplicacheAccessor("listArticleLinks");

        const nodeById = nodes.reduce(
            (acc, node) => ((acc[node.id] = node), acc)
        );
        links = links.filter((l) => nodeById[l.source] && nodeById[l.target]);

        const linksPerNode = new Map<string, ArticleLink>();
        links
            .sort((a, b) => a.weight - b.weight)
            .map((l) => {
                linksPerNode.set(l.source, [
                    ...(linksPerNode.get(l.source) || []),
                    l,
                ]);
                // linksPerNode.set(l.target, [
                //     ...(linksPerNode.get(l.target) || []),
                //     l,
                // ]);
            });

        // links = links.map((l) => {
        //     l.source = nodeIndexById[l.source];
        //     l.target = nodeIndexById[l.target];
        //     return l;
        // });
        // nodes = nodes.map((n) => {
        //     n.id = nodeIndexById[n.id] || 0;
        //     return n;
        // });

        links = [];
        const filteredLinkCountPerNode = {};
        [...linksPerNode.entries()].map(([id, ls]) => {
            ls.sort((a, b) => b.score - a.score)
                .slice(0, 3)
                .map((l) => {
                    links.push(l);

                    // filteredLinkCountPerNode[l.source] =
                    //     (filteredLinkCountPerNode[l.source] || 0) + 1;
                    filteredLinkCountPerNode[l.target] =
                        (filteredLinkCountPerNode[l.target] || 0) + 1;
                });
        });

        // console.log(filteredLinkCountPerNode);
        nodes = nodes.map((n) => {
            return {
                ...n,
                linkCount: filteredLinkCountPerNode[n.id] || 0,
                days_ago: (Date.now() - n.time_added * 1000) / 86400000,
            };
        });

        return { nodes, links };

        // const mstLinks = kruskal(
        //     links.map((l) => ({
        //         ...l,
        //         from: l.source,
        //         to: l.target,
        //         weight: 1 - l.score!,
        //     }))
        // );
        // setGraph({ nodes, links: mstLinks });
    }
}

const librarySignupStaticArticles: LibraryArticle[] = [
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
