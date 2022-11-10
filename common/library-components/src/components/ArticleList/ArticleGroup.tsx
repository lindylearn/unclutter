import { DraggableArticleList, StaticArticleList } from "../../components";
import React, { ReactNode } from "react";
import clsx from "clsx";
import { getRandomLightColor } from "../../common";
import { Article, readingProgressFullClamp } from "../../store";
import { ReadingProgress } from "../Modal/components/numbers";
import { getActivityColor } from "../Charts";

export function ArticleGroup({
    groupKey,
    title,
    icon,
    color,
    articles,
    articleLines = 1,
    isTopic,
    darkModeEnabled,
    showTopic,
    reportEvent = () => {},
    enableDragging = true,
    showProgress = true,
    className,
}: {
    groupKey: string;
    title?: string;
    icon?: ReactNode;
    color?: string;
    articles: Article[];
    articleLines?: number;
    isTopic?: boolean;
    darkModeEnabled: boolean;
    showTopic?: (topicId: string) => void;
    reportEvent?: (event: string, data?: any) => void;
    enableDragging?: boolean;
    showProgress?: boolean;
    className?: string;
}) {
    color =
        color ||
        (groupKey === "queue"
            ? getActivityColor(3, darkModeEnabled)
            : getRandomLightColor(groupKey, darkModeEnabled));
    // const unqueuedArticles = articles.filter((a) => !a.is_queued);

    const readCount = articles?.filter(
        (a) => a.reading_progress >= readingProgressFullClamp
    )?.length;

    return (
        <div className={clsx("topic relative", className)}>
            <div className="topic-header mx-0.5 mb-2 flex justify-between">
                <h2
                    className={clsx(
                        "title flex select-none items-center gap-2 font-medium",
                        isTopic && "cursor-pointer transition-transform hover:scale-[96%]"
                    )}
                    onClick={() => {
                        if (isTopic && showTopic) {
                            showTopic(groupKey);
                        }
                    }}
                >
                    {icon}
                    {title}
                </h2>

                {showProgress && (
                    <ReadingProgress
                        className="relative px-1.5 py-0.5"
                        articleCount={articles?.length}
                        readCount={readCount}
                        color={color}
                    />
                )}
            </div>

            {/* {!isTopic && groupKey !== "search" && (
                <ReadingProgress
                    className="absolute -top-[3rem] right-0 px-2 py-1"
                    articleCount={articles?.length}
                    readCount={readCount}
                    color={color}
                />
            )} */}

            <div
                className="topic-articles relative rounded-md p-3 transition-colors"
                style={{
                    height: `${11.5 * articleLines - 0.75 * (articleLines - 1)}rem`, // article height + padding to prevent size change
                    background: color,
                }}
            >
                {groupKey === "queue" && articles.length === 0 && (
                    <div className="animate-fadein absolute top-0 left-0 flex h-full w-full select-none items-center justify-center">
                        Drag articles here or use the article right-click menu.
                    </div>
                )}
                {groupKey === "new" && articles.length === 0 && (
                    <div className="animate-fadein absolute top-0 left-0 flex h-full w-full select-none items-center justify-center">
                        Follow feeds to see their new articles here.
                    </div>
                )}
                {groupKey === "past" && articles.length === 0 && (
                    <div className="animate-fadein absolute top-0 left-0 flex h-full w-full select-none items-center justify-center">
                        No past feed articles found.
                    </div>
                )}
                {groupKey === "list" && articles.length === 0 && (
                    <div className="animate-fadein absolute top-0 left-0 flex h-full w-full select-none items-center justify-center">
                        Open articles with Unclutter to automatically save them.
                    </div>
                )}
                {/* {groupKey !== "queue" && groupKey !== "search" && articles.length === 0 && (
                    <div className="animate-fadein absolute top-0 left-0 flex h-full w-full select-none items-center justify-center">
                        All filtered articles are in your reading queue.
                    </div>
                )} */}

                {enableDragging ? (
                    <DraggableArticleList
                        listId={groupKey}
                        articlesToShow={articleLines * 5}
                        small
                        reportEvent={reportEvent}
                    />
                ) : (
                    <StaticArticleList articles={articles.slice(0, articleLines * 5)} small />
                )}
            </div>
        </div>
    );
}
