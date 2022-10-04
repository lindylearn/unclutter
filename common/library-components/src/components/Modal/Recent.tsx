import {
    DraggableArticleList,
    useTabInfos,
    InlineProgressCircle,
} from "../../components";
import React, { ReactNode, useContext, useEffect, useState } from "react";
import { getRandomColor, getRandomLightColor } from "../../common";
import { Article, ReplicacheContext, Topic } from "../../store";
import { ResourceStat } from "./Stats";

export default function RecentModalTab({
    currentTopic,
    darkModeEnabled,
    showTopic,
}: {
    currentTopic?: Topic;
    darkModeEnabled: boolean;
    showTopic: (topic: Topic) => void;
}) {
    const [tabInfos, unreadArticlesCount] = useTabInfos(10, true);

    // TODO ensure currentTopic is present and first in list

    return (
        <div className="flex flex-col gap-4 pt-1">
            {tabInfos?.map((tabInfo, index) => (
                <TopicGroup
                    darkModeEnabled={darkModeEnabled}
                    {...tabInfo}
                    showTopic={showTopic}
                />
            ))}
        </div>
    );
}

function TopicGroup({
    title,
    icon,
    articles,
    darkModeEnabled,
    showTopic,
}: {
    key: string;
    title: string;
    icon?: ReactNode;
    articles: Article[];
    darkModeEnabled: boolean;
    showTopic: (topic: Topic) => void;
}) {
    const topic_id = articles[0].topic_id!;

    const rep = useContext(ReplicacheContext);
    const [allTopicArticles, setAllTopicArticles] = useState<Article[]>();
    const [topic, setTopic] = useState<Topic>();
    useEffect(() => {
        rep?.query.listTopicArticles(topic_id).then(setAllTopicArticles);
        rep?.query.getTopic(topic_id).then(setTopic);
    }, [rep]);

    return (
        <div className="topic animate-fadein">
            <div className="topic-header mx-0.5 mb-2 flex justify-between">
                <h2
                    className="title flex cursor-pointer items-center gap-2 font-medium transition-transform hover:scale-[96%]"
                    onClick={() => showTopic(topic!)}
                >
                    {icon}
                    {title}
                </h2>
                <div className="stats flex gap-2 font-medium text-stone-300">
                    {/* <InlineProgressCircle
                        current={articles.length}
                        target={10}
                    />
                    <span className="ml-1">{10 - articles.length} unread</span> */}

                    <ResourceStat
                        value={allTopicArticles?.length}
                        type="articles"
                    />
                    <ResourceStat value={0} type="highlights" />
                </div>
            </div>
            <div
                className="topic-articles rounded-md p-3"
                style={{
                    height: "11.5rem", // article height + padding to prevent size change
                    background: getRandomLightColor(topic_id, darkModeEnabled),
                }}
            >
                <DraggableArticleList
                    articles={articles}
                    articlesToShow={5}
                    sortPosition="topic_sort_position"
                    small
                    // reportEvent={reportEvent}
                />
            </div>
        </div>
    );
}
