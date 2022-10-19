import React, { useContext, useEffect } from "react";
import clsx from "clsx";
import { ReactNode, useState } from "react";
import useResizeObserver from "use-resize-observer";

import { getRandomColor } from "../../common/styling";
import {
    Article,
    readingProgressFullClamp,
    UserInfo,
} from "../../store/_schema";
import {
    ReplicacheContext,
    sortArticlesPosition,
    useSubscribe,
} from "../../store";
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

    const { ref: listRef, width: listWidth = 0 } =
        useResizeObserver<HTMLDivElement>();
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
                            index !== activeIndex &&
                                index > 0 &&
                                "dark:text-gray-200",
                            index !== activeIndex &&
                                index === 0 &&
                                "dark:opacity-50",
                            key === "continue" &&
                                "bg-lindy dark:bg-lindyDark dark:text-black"
                        )}
                        style={{
                            background:
                                key !== "continue"
                                    ? getRandomColor(key).replace(
                                          "0.4)",
                                          index === activeIndex
                                              ? "0.3)"
                                              : "0.1)"
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
                {activeIndex !== undefined &&
                    activeIndex !== null &&
                    articlesPerRow !== 0 && (
                        <StaticArticleList
                            articles={tabInfos[activeIndex].articles || []}
                            small
                        />
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
    domainFilter: string | null,
    userInfo: UserInfo
): TabInfo[] | undefined {
    const rep = useContext(ReplicacheContext);

    const articles = useSubscribe(
        rep,
        rep?.subscribe.listRecentArticles(),
        null
    );

    let [tabInfos, setTabInfos] = useState<TabInfo[]>();
    useEffect(() => {
        if (!articles) {
            return;
        }
        (async () => {
            const queueArticles = articles.filter((a) => a.is_queued);
            let listArticles = articles; // filtered after topic grouping to keep ordering stable
            sortArticlesPosition(queueArticles, "queue_sort_position");

            if (onlyUnread) {
                listArticles = listArticles.filter(
                    (a) => a.reading_progress < readingProgressFullClamp
                );
            }
            if (domainFilter) {
                listArticles = listArticles.filter(
                    (a) => getDomain(a.url) === domainFilter
                );
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
                    articles: queueArticles || [],
                    articleLines: 1,
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
                const topicTabInfos: TabInfo[] = await Promise.all(
                    groupEntries
                        .filter((e) => e[0] !== "Other")
                        .map(async ([topic_id, articles]) => {
                            const topic = await rep?.query.getTopic(topic_id);
                            return {
                                key: topic_id,
                                title: topic?.name || topic_id,
                                icon: topic && (
                                    <TopicEmoji
                                        emoji={topic?.emoji!}
                                        className="mr-0 w-[18px]"
                                    />
                                ),
                                isTopic: true,
                                articles: articles.filter((a) => !a.is_queued),
                            };
                        })
                );
                tabInfos.push(...topicTabInfos);
            } else {
                tabInfos.push({
                    key: domainFilter || "list",
                    title: "",
                    articles: listArticles,
                    articleLines: Math.max(
                        1,
                        Math.min(5, Math.ceil(listArticles.length / 5))
                    ),
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
    let [articleListsCache, setArticleListsCache] =
        useState<ArticleListsCache>();
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
