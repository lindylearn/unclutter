import React, { useContext, useEffect } from "react";
import clsx from "clsx";
import { ReactNode, useState } from "react";
import useResizeObserver from "use-resize-observer";
import partition from "lodash/partition";

import { getRandomColor } from "../../common/styling";
import type { Article, Topic, UserInfo } from "../../store/_schema";
import {
    readingProgressFullClamp,
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
                    icon: (
                        <svg className="h-4" viewBox="0 0 640 512">
                            <path
                                fill="currentColor"
                                d="M443.5 17.94C409.8 5.608 375.3 0 341.4 0C250.1 0 164.6 41.44 107.1 112.1c-6.752 8.349-2.752 21.07 7.375 24.68C303.1 203.8 447.4 258.3 618.4 319.1c1.75 .623 3.623 .9969 5.5 .9969c8.25 0 15.88-6.355 16-15.08C643 180.7 567.2 62.8 443.5 17.94zM177.1 108.4c42.88-36.51 97.76-58.07 154.5-60.19c-4.5 3.738-36.88 28.41-70.25 90.72L177.1 108.4zM452.6 208.1L307.4 155.4c14.25-25.17 30.63-47.23 48.13-63.8c25.38-23.93 50.13-34.02 67.51-27.66c17.5 6.355 29.75 29.78 33.75 64.42C459.6 152.4 457.9 179.6 452.6 208.1zM497.8 224.4c7.375-34.89 12.13-76.76 4.125-117.9c45.75 38.13 77.13 91.34 86.88 150.9L497.8 224.4zM576 488.1C576 501.3 565.3 512 552 512L23.99 510.4c-13.25 0-24-10.72-24-23.93c0-13.21 10.75-23.93 24-23.93l228 .6892l78.35-214.8l45.06 16.5l-72.38 198.4l248.1 .7516C565.3 464.1 576 474.9 576 488.1z"
                            />
                        </svg>
                    ),
                    articles: queueArticles,
                    articleLines: 1,
                },
                // {
                //     key: "new",
                //     title: "Your feeds",
                //     icon: (
                //         <svg className="w-4" viewBox="0 0 512 512">
                //             <path
                //                 fill="currentColor"
                //                 d="M464 320h-96c-9.094 0-17.41 5.125-21.47 13.28L321.2 384H190.8l-25.38-50.72C161.4 325.1 153.1 320 144 320H32c-17.67 0-32 14.33-32 32v96c0 35.35 28.65 64 64 64h384c35.35 0 64-28.65 64-64v-80C512 341.5 490.5 320 464 320zM464 448c0 8.822-7.178 16-16 16H64c-8.822 0-16-7.178-16-16v-80h81.16l25.38 50.72C158.6 426.9 166.9 432 176 432h160c9.094 0 17.41-5.125 21.47-13.28L382.8 368H464V448zM238.4 312.3C242.1 317.2 249.3 320 256 320s13.03-2.781 17.59-7.656l104-112c9-9.719 8.438-24.91-1.25-33.94c-9.719-8.969-24.88-8.438-33.94 1.25L280 234.9V24c0-13.25-10.75-24-24-24S232 10.75 232 24v210.9L169.6 167.7C160.5 157.1 145.4 157.4 135.7 166.4C125.1 175.4 125.4 190.6 134.4 200.3L238.4 312.3z"
                //             />
                //         </svg>
                //     ),
                //     articles: newArticles,
                //     articleLines: Math.max(1, Math.min(2, Math.ceil(newArticles.length / 5))),
                // },
            ];
            if (false) {
                // userInfo.onPaidPlan || userInfo.trialEnabled
                // const groupEntries = await groupArticlesByTopic(
                //     listArticles,
                //     true,
                //     "recency",
                //     "topic_order",
                //     tabCount - 2
                // );
                // const otherArticles: Article[] = []; // might be spread across multiple topics, e.g. if combining small groups locally
                // let otherGroupId: string = "other";
                // const topicTabInfos: TabInfo[] = await Promise.all(
                //     groupEntries.map(async ([topic_id, articles]) => {
                //         const topic: Topic | undefined = await rep?.query.getTopic(topic_id);
                //         if (!topic || topic.name === "Other") {
                //             if (topic?.id) {
                //                 otherGroupId = topic.id;
                //             }
                //             otherArticles.push(...articles);
                //             articles = [];
                //         }
                //         return {
                //             key: topic_id,
                //             title: topic?.name || topic_id,
                //             icon: topic && (
                //                 <TopicEmoji emoji={topic?.emoji!} className="mr-0 w-[18px]" />
                //             ),
                //             isTopic: true,
                //             articles: articles.filter((a) => !a.is_queued),
                //         };
                //     })
                // );
                // tabInfos.push(...topicTabInfos.filter((t) => t.articles.length > 0));
                // if (otherArticles.length > 0) {
                //     tabInfos.push({
                //         key: otherGroupId,
                //         title: "Other",
                //         icon: <></>,
                //         isTopic: true,
                //         articles: otherArticles,
                //     });
                // }
            } else {
                listArticles = listArticles.filter((a) => !a.is_queued);
                const [uncompletedArticles, completedArticles] = partition(
                    listArticles,
                    (a) => a.reading_progress < readingProgressFullClamp
                );

                tabInfos.push(
                    ...[
                        {
                            key: "uncompleted",
                            title: "Continue reading",
                            icon: (
                                <svg className="h-4" viewBox="0 0 384 512">
                                    <path
                                        fill="currentColor"
                                        d="M24.52 38.13C39.66 29.64 58.21 29.99 73.03 39.04L361 215C375.3 223.8 384 239.3 384 256C384 272.7 375.3 288.2 361 296.1L73.03 472.1C58.21 482 39.66 482.4 24.52 473.9C9.377 465.4 0 449.4 0 432V80C0 62.64 9.377 46.63 24.52 38.13V38.13zM48 432L336 256L48 80V432z"
                                    />
                                </svg>
                            ),
                            articles: uncompletedArticles,
                            articleLines: Math.max(
                                1,
                                Math.min(2, Math.ceil(uncompletedArticles.length / 5))
                            ),
                        },
                        {
                            key: "completed",
                            title: "Recently read",
                            icon: (
                                <svg className="h-4" viewBox="0 0 512 512">
                                    <path
                                        fill="currentColor"
                                        d="M256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512C203.8 512 155.2 496.4 114.7 469.5C103.7 462.2 100.7 447.3 107.1 436.3C115.3 425.2 130.2 422.2 141.3 429.5C174.1 451.3 213.5 464 256 464C370.9 464 464 370.9 464 256C464 141.1 370.9 48 256 48C182.4 48 117.7 86.24 80.69 144H136C149.3 144 160 154.7 160 168C160 181.3 149.3 192 136 192H24C10.75 192 0 181.3 0 168V56C0 42.75 10.75 32 24 32C37.25 32 48 42.75 48 56V106.7C94.45 42.12 170.3 0 256 0H256zM256 128C269.3 128 280 138.7 280 152V246.1L344.1 311C354.3 320.4 354.3 335.6 344.1 344.1C335.6 354.3 320.4 354.3 311 344.1L239 272.1C234.5 268.5 232 262.4 232 256V152C232 138.7 242.7 128 256 128V128z"
                                    />
                                </svg>
                            ),
                            articles: completedArticles,
                            articleLines: Math.max(
                                2,
                                Math.min(5, Math.ceil(completedArticles.length / 5))
                            ),
                        },
                    ]
                );
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
