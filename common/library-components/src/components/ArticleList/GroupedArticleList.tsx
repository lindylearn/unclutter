import React from "react";
import clsx from "clsx";
import partition from "lodash/partition";
import { useContext, useEffect, useState } from "react";
import { useSubscribe } from "replicache-react";

import { ReplicacheContext } from "../../store";
import { getRandomColor } from "../../common/styling";
import { groupBy } from "../../common/util";
import {
    getSafeArticleSortPosition,
    getTopic,
    sortArticlesPosition,
} from "../../store/accessors";
import { Article } from "../../store/_schema";
import { ArticlePreview } from "../Article/ArticlePreview";
import { TopicTag } from "../TopicTag";
import { DraggableArticleList } from "./DraggableArticleList";

export function GroupedArticleList({
    articles,
    enableArticleStacks = false,
    combineSmallGroups = false,
    setSelectedTopicId = undefined,
    sortGroupsBy = "recency",
    sortArticlesBy = "topic_order",
}: {
    articles: Article[];
    enableArticleStacks?: boolean;
    combineSmallGroups?: boolean;
    setSelectedTopicId?: (topicId: string | null) => void;
    sortGroupsBy?: "recency_position" | "recency" | "topic_size";
    sortArticlesBy?: "recency_order" | "topic_order";
}) {
    const groups = useArticleGroups(
        articles,
        combineSmallGroups,
        sortGroupsBy,
        sortArticlesBy
    );

    return (
        <div className="flex flex-col gap-3">
            {groups?.map(([topic_id, articles]) => (
                <TopicGroupBackground
                    key={topic_id}
                    topic_id={topic_id}
                    setSelectedTopicId={setSelectedTopicId}
                >
                    <div
                        className={clsx(
                            "flex flex-wrap gap-2",
                            enableArticleStacks &&
                                articles.length > 1 &&
                                "stacked-articles-list"
                        )}
                        style={{
                            marginRight: enableArticleStacks
                                ? `${(articles.length - 1) * -224 * 0.5}px`
                                : "",
                        }}
                    >
                        <DraggableArticleList
                            articles={articles}
                            sortPosition="topic_sort_position"
                        />
                    </div>
                </TopicGroupBackground>
            ))}
        </div>
    );
}

export function useArticleGroups(
    articles: Article[],
    combineSmallGroups?: boolean,
    sortGroupsBy?: "recency_position" | "recency" | "topic_size",
    sortArticlesBy?: "recency_order" | "topic_order",
    maxGroupCount?: number
) {
    const rep = useContext(ReplicacheContext);

    const [groups, setGroups] = useState<[string, Article[]][]>();
    useEffect(() => {
        (async () => {
            const groupsMap: { [topic_id: string]: Article[] } = groupBy(
                articles,
                "topic_id"
            );
            let groupEntries = Object.entries(groupsMap);

            if (combineSmallGroups) {
                const [largeGroups, singleGroups] = partition(
                    groupEntries,
                    ([_, articles]) => articles.length > 1
                );
                groupEntries = largeGroups;

                if (
                    maxGroupCount === undefined ||
                    largeGroups.length < maxGroupCount
                ) {
                    // only group if need more topics

                    // if (singleGroups.length > 0) {
                    //     groupEntries.push([
                    //         "Other",
                    //         singleGroups.flatMap(([_, articles]) => articles),
                    //     ]);
                    // }

                    const otherArticles = (
                        await Promise.all(
                            singleGroups.map(async ([topic_id, articles]) => {
                                const topic = await rep?.query((tx) =>
                                    getTopic(tx, topic_id)
                                );
                                return articles.map((a) => ({
                                    ...a,
                                    group_id: topic?.group_id,
                                }));
                            })
                        )
                    ).flat();

                    const [groupGroupEntries, uncategorizedEntries] = partition(
                        Object.entries(groupBy(otherArticles, "group_id")),
                        // @ts-ignore
                        ([_, articles]) => articles.length > 1
                    );
                    // @ts-ignore
                    groupEntries = groupEntries.concat(groupGroupEntries);
                    if (uncategorizedEntries.length > 0) {
                        groupEntries.push([
                            "Other",
                            // @ts-ignore
                            uncategorizedEntries.flatMap(
                                ([_, articles]) => articles
                            ),
                        ]);
                    }
                }
            }

            if (sortGroupsBy === "recency_position") {
                // combineSmallGroups requires re-sort
                groupEntries.sort(
                    (a, b) =>
                        getSafeArticleSortPosition(
                            b[1][0],
                            "recency_sort_position"
                        ) -
                        getSafeArticleSortPosition(
                            a[1][0],
                            "recency_sort_position"
                        )
                );
            } else if (sortGroupsBy === "recency") {
                // sort by recently added groups, not recency positioning (e.g to keep stable during reorders)
                groupEntries.sort(
                    (a, b) => b[1][0].time_added - a[1][0].time_added
                );
            } else if (sortGroupsBy === "topic_size") {
                groupEntries.sort((a, b) => b[1].length - a[1].length);
            }

            groupEntries.map(([topic_id, articles]) => {
                if (sortArticlesBy === "recency_order") {
                    // passed articles should already be sorted
                } else if (sortArticlesBy === "topic_order") {
                    sortArticlesPosition(articles, "topic_sort_position");
                }
            });

            setGroups(groupEntries);
        })();
    }, [articles]);

    return groups;
}

export function TopicGroupBackground({
    topic_id,
    children,
    className = "",
    setSelectedTopicId = undefined,
}: {
    topic_id: string;
    children: React.ReactNode;
    className?: string;
    setSelectedTopicId?: (topicId: string | null) => void;
}) {
    const topicColor = getRandomColor(topic_id).replace("0.4)", "0.15)");

    return (
        <div
            key={topic_id}
            className={clsx("article-group animate-fadein relative", className)}
        >
            <div
                className="rounded-lg p-2.5 shadow"
                style={{ background: topicColor }}
            >
                {children}
            </div>

            <div className="absolute bottom-1.5 right-0.5 font-bold">
                {topic_id !== "Other" ? (
                    <TopicTag
                        topic_id={topic_id}
                        className="relative left-0.5"
                        colorSeed={topic_id}
                        onClick={
                            setSelectedTopicId &&
                            (() => setSelectedTopicId(topic_id))
                        }
                        noBackground
                        large
                    />
                ) : (
                    <div className="mr-3 mb-2 select-none text-xl font-medium leading-none opacity-60">
                        Other
                    </div>
                )}
            </div>
        </div>
    );
}
