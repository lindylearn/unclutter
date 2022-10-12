import React, { useContext, useEffect } from "react";
import clsx from "clsx";
import { ReactNode, useState } from "react";
import useResizeObserver from "use-resize-observer";

import { getRandomColor } from "../../common/styling";
import { Article, readingProgressFullClamp } from "../../store/_schema";
import {
    ReplicacheContext,
    sortArticlesPosition,
    useSubscribe,
} from "../../store";
import { useArticleGroups } from "./GroupedArticleList";
import { TopicEmoji } from "../TopicTag";
import { DraggableArticleList } from "./DraggableArticleList";
import { LindyIcon } from "../Icons";
import { subDays } from "date-fns";
import DraggableContext from "./DraggableContext";

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
                        <DraggableContext
                            articleLists={{
                                default: tabInfos[activeIndex].articles || [],
                            }}
                        >
                            <DraggableArticleList
                                listId="default"
                                articlesToShow={articlesPerRow * articleRows}
                                sortPosition={
                                    tabInfos[activeIndex].key === "favorite"
                                        ? "favorites_sort_position"
                                        : tabInfos[activeIndex].key === "unread"
                                        ? "recency_sort_position"
                                        : "topic_sort_position"
                                }
                                centerGrid
                                reportEvent={reportEvent}
                            />
                        </DraggableContext>
                    )}
            </div>
        </div>
    );
}

export function useTabInfos(
    tabCount: number = 9,
    onlyUnread: boolean = false,
    reverseOrder: boolean = false,
    start: Date | null = subDays(new Date(), 90)
): [TabInfo[] | undefined, number] {
    const rep = useContext(ReplicacheContext);
    const [allArticles, setAllArticles] = useState<Article[]>([]);
    useEffect(() => {
        rep?.query
            .listRecentArticles(start?.getTime(), onlyUnread ? "unread" : "all")
            .then(setAllArticles);
    }, [onlyUnread]);

    const groups = useArticleGroups(
        allArticles,
        true,
        "recency_position", // TODO: fix reordering after enabling subscribe()
        reverseOrder ? "reverse_recency_order" : "recency_order",
        tabCount
    );

    const [tabInfos, setTabInfos] = useState<TabInfo[]>();
    useEffect(() => {
        (async () => {
            if (!groups || groups.length === 0) {
                return;
            }

            // const unreadArticles = allArticles.filter(
            //     (a) => a.reading_progress < readingProgressFullClamp
            // );
            const staticTabInfos: TabInfo[] = [
                {
                    key: "queue",
                    title: "Reading queue",
                    articles: [],
                    articleLines: 1,
                    // color={
                    //     darkModeEnabled
                    //         ? "hsl(51, 80%, 43%)"
                    //         : "hsl(51, 80%, 64%)"
                    // }
                },
                // {
                //     key: "unread",
                //     title: "Unread articles",
                //     articles: unreadArticles,
                //     articleLines: 5,
                // },
            ];
            const groupTabInfos: TabInfo[] = await Promise.all(
                groups
                    .slice(0, tabCount - staticTabInfos.length)
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
                            articles: sortArticlesPosition(
                                articles,
                                "topic_sort_position"
                            ),
                        };
                    })
            );

            setTabInfos(staticTabInfos.concat(groupTabInfos));
        })();
    }, [groups]);

    return [tabInfos, allArticles.length];
}
