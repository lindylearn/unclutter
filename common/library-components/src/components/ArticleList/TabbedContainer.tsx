import React, { useContext, useEffect } from "react";
import clsx from "clsx";
import { ReactNode, useState } from "react";
import useResizeObserver from "use-resize-observer";
import partition from "lodash/partition";

import { getRandomColor } from "../../common/styling";
import { Article, readingProgressFullClamp, Topic, UserInfo } from "../../store/_schema";
import { ReplicacheContext, sortArticlesPosition, useSubscribe } from "../../store";
import { groupArticlesByTopic } from "./GroupedArticleList";
import { TopicEmoji } from "../TopicTag";
import { ArticleListsCache } from "./DraggableContext";
import { StaticArticleList } from "./StaticArticleList";
import { getDomain } from "../../common";

export interface TabInfo {
    key: string;
    title: string;
    isTopic?: boolean;
    articleLines?: number;
    icon?: ReactNode;
    articles: Article[];
}

export function TabbedContainer({
    tabInfos,
    articleRows = 2,
    initialIndex = 0,
    setInitialIndex,
    reportEvent = () => {},
}: {
    tabInfos: TabInfo[];
    articleRows?: number;
    initialIndex?: number | null;
    setInitialIndex?: (key: number | null) => void;
    reportEvent?: (event: string, properties?: any) => void;
}) {
    const [activeIndex, setActiveIndex] = useState<number | null>(initialIndex);
    useEffect(() => {
        if (setInitialIndex) {
            setInitialIndex(activeIndex);
        }
    }, [activeIndex]);

    const { ref: listRef, width: listWidth = 0 } = useResizeObserver<HTMLDivElement>();
    const articlesPerRow = Math.floor((listWidth + 12) / (176 + 12));

    return (
        <div className="article-group animate-fadein relative">
            <div className="font-title relative mb-2 flex justify-center gap-3 text-base">
                {tabInfos.map(({ key, title, icon }, index) => (
                    <h2
                        key={key}
                        className={clsx(
                            "article-tab relative flex cursor-pointer items-center gap-1.5 rounded-lg px-1.5 py-0.5 leading-none transition-all",
                            index === activeIndex
                                ? "shadow"
                                : "text-gray-600 opacity-90 hover:scale-95 dark:opacity-70",
                            index !== activeIndex && index > 0 && "dark:text-gray-200",
                            index !== activeIndex && index === 0 && "dark:opacity-50",
                            key === "continue" && "bg-lindy dark:bg-lindyDark dark:text-black"
                        )}
                        style={{
                            background:
                                key !== "continue"
                                    ? getRandomColor(key).replace(
                                          "0.4)",
                                          index === activeIndex ? "0.3)" : "0.1)"
                                      )
                                    : undefined,
                        }}
                        onClick={() => {
                            setActiveIndex(index);
                            reportEvent("changeArticleTab", { key });
                        }}
                    >
                        {icon}
                        <div>
                            {title}
                            {/* {index === 0 && (
                                <div className="absolute -right-2 -top-2 rounded-lg bg-gray-50 px-1 leading-tight shadow-sm dark:bg-stone-700">
                                    {tabInfos[index].articles.length}
                                </div>
                            )} */}
                        </div>
                    </h2>
                ))}
                <div
                    className={clsx(
                        "cursor-pointer px-2 py-0.5 transition-all",
                        activeIndex === null
                            ? ""
                            : "text-gray-600 opacity-70 hover:scale-95 dark:text-gray-100"
                    )}
                    onClick={() => {
                        setActiveIndex(null);
                        reportEvent("hideArticles");
                    }}
                >
                    Hide
                </div>
            </div>

            <div
                className="relative overflow-y-hidden rounded-lg rounded-tl-none p-3 pb-10"
                style={{ maxHeight: `${articleRows * (208 + 12) + 40}px` }}
                ref={listRef}
            >
                {activeIndex !== undefined && activeIndex !== null && articlesPerRow !== 0 && (
                    <StaticArticleList articles={tabInfos[activeIndex].articles || []} small />
                    // <DraggableContext
                    //     articleLists={{
                    //         default: tabInfos[activeIndex].articles || [],
                    //     }}
                    // >
                    //     <DraggableArticleList
                    //         listId="default"
                    //         articlesToShow={articlesPerRow * articleRows}
                    //         // sortPosition={
                    //         //     tabInfos[activeIndex].key === "favorite"
                    //         //         ? "favorites_sort_position"
                    //         //         : tabInfos[activeIndex].key === "unread"
                    //         //         ? "recency_sort_position"
                    //         //         : "topic_sort_position"
                    //         // }
                    //         centerGrid
                    //         reportEvent={reportEvent}
                    //     />
                    // </DraggableContext>
                )}
            </div>
        </div>
    );
}

export function useTabInfos(
    tabCount: number = 10,
    onlyUnread: boolean = false,
    lastFirst: boolean = false,
    domainFilter: string | undefined,
    userInfo: UserInfo
): TabInfo[] | undefined {
    const rep = useContext(ReplicacheContext);

    const articles = useSubscribe(rep, rep?.subscribe.listRecentArticles(), null);

    let [tabInfos, setTabInfos] = useState<TabInfo[]>();
    useEffect(() => {
        if (!articles) {
            return;
        }
        (async () => {
            const queueArticles = articles.filter((a) => a.is_queued);
            let listArticles = articles; // filtered after topic grouping to keep ordering stable
            sortArticlesPosition(queueArticles, "queue_sort_position");

            let newArticles: Article[];
            [newArticles, listArticles] = partition(listArticles, (a) => a.is_new);
            newArticles = newArticles
                .filter((a) => !a.is_queued)
                .filter((a) => a.reading_progress < readingProgressFullClamp);

            if (onlyUnread) {
                listArticles = listArticles.filter(
                    (a) => a.reading_progress < readingProgressFullClamp
                );
            }
            if (domainFilter) {
                listArticles = listArticles.filter((a) => getDomain(a.url) === domainFilter);
                sortArticlesPosition(listArticles, "domain_sort_position");
            }
            if (!lastFirst) {
                listArticles.reverse();
            }

            // construct tab infos
            const tabInfos: TabInfo[] = [
                {
                    key: "queue",
                    title: "Reading Queue",
                    articles: queueArticles,
                    articleLines: 1,
                },
                {
                    key: "new",
                    title: "Following",
                    icon: (
                        <svg className="w-4" viewBox="0 0 448 512">
                            <path
                                fill="currentColor"
                                d="M432 256C432 269.3 421.3 280 408 280h-160v160c0 13.25-10.75 24.01-24 24.01S200 453.3 200 440v-160h-160c-13.25 0-24-10.74-24-23.99C16 242.8 26.75 232 40 232h160v-160c0-13.25 10.75-23.99 24-23.99S248 58.75 248 72v160h160C421.3 232 432 242.8 432 256z"
                            />
                        </svg>
                    ),
                    articles: newArticles,
                    articleLines: Math.max(1, Math.min(2, Math.ceil(newArticles.length / 5))),
                },
            ];
            if (userInfo.onPaidPlan || userInfo.trialEnabled) {
                const groupEntries = await groupArticlesByTopic(
                    listArticles,
                    true,
                    "recency",
                    "topic_order",
                    tabCount
                );
                const otherArticles: Article[] = []; // might be spread across multiple topics, e.g. if combining small groups locally
                let otherGroupId: string = "other";
                const topicTabInfos: TabInfo[] = await Promise.all(
                    groupEntries.map(async ([topic_id, articles]) => {
                        const topic: Topic | undefined = await rep?.query.getTopic(topic_id);
                        if (!topic || topic.name === "Other") {
                            if (topic?.id) {
                                otherGroupId = topic.id;
                            }
                            otherArticles.push(...articles);
                            articles = [];
                        }

                        return {
                            key: topic_id,
                            title: topic?.name || topic_id,
                            icon: topic && (
                                <TopicEmoji emoji={topic?.emoji!} className="mr-0 w-[18px]" />
                            ),
                            isTopic: true,
                            articles: articles.filter((a) => !a.is_queued),
                        };
                    })
                );
                tabInfos.push(...topicTabInfos.filter((t) => t.articles.length > 0));
                if (otherArticles.length > 0) {
                    tabInfos.push({
                        key: otherGroupId,
                        title: "Other",
                        icon: <></>,
                        isTopic: true,
                        articles: otherArticles,
                    });
                }
            } else {
                listArticles = listArticles.filter((a) => !a.is_queued);

                tabInfos.push({
                    key: domainFilter || "list",
                    title: "Recently opened",
                    icon: (
                        <svg className="w-4" viewBox="0 0 512 512">
                            <path
                                fill="currentColor"
                                d="M256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512C203.8 512 155.2 496.4 114.7 469.5C103.7 462.2 100.7 447.3 107.1 436.3C115.3 425.2 130.2 422.2 141.3 429.5C174.1 451.3 213.5 464 256 464C370.9 464 464 370.9 464 256C464 141.1 370.9 48 256 48C182.4 48 117.7 86.24 80.69 144H136C149.3 144 160 154.7 160 168C160 181.3 149.3 192 136 192H24C10.75 192 0 181.3 0 168V56C0 42.75 10.75 32 24 32C37.25 32 48 42.75 48 56V106.7C94.45 42.12 170.3 0 256 0H256zM256 128C269.3 128 280 138.7 280 152V246.1L344.1 311C354.3 320.4 354.3 335.6 344.1 344.1C335.6 354.3 320.4 354.3 311 344.1L239 272.1C234.5 268.5 232 262.4 232 256V152C232 138.7 242.7 128 256 128V128z"
                            />
                        </svg>
                    ),
                    articles: listArticles,
                    articleLines: Math.max(1, Math.min(5, Math.ceil(listArticles.length / 5))),
                });
            }

            // update state
            setTabInfos(tabInfos);
        })();
    }, [articles, onlyUnread, lastFirst, domainFilter]);

    return tabInfos;
}

export function useArticleListsCache(
    tabInfos: TabInfo[] | undefined
): [ArticleListsCache | undefined, (articleLists: ArticleListsCache) => void] {
    let [articleListsCache, setArticleListsCache] = useState<ArticleListsCache>();
    useEffect(() => {
        if (!tabInfos) {
            return;
        }
        setArticleListsCache(
            tabInfos?.reduce(
                (obj, tabInfo) => ({
                    ...obj,
                    [tabInfo.key]: tabInfo.articles,
                }),
                {}
            )
        );
    }, [tabInfos]);

    return [articleListsCache, setArticleListsCache];
}
