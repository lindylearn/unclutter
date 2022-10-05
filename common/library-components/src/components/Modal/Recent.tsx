import { DraggableArticleList, useTabInfos } from "../../components";
import React, { ReactNode, useContext, useEffect, useState } from "react";
import { getRandomLightColor, reportEventContentScript } from "../../common";
import {
    Article,
    readingProgressFullClamp,
    ReplicacheContext,
    Topic,
} from "../../store";
import { ReadingProgress } from "./numbers";

export default function RecentModalTab({
    currentTopic,
    darkModeEnabled,
    showTopic,
    reportEvent = () => {},
}: {
    currentTopic?: Topic;
    darkModeEnabled: boolean;
    showTopic: (topic: Topic) => void;
    reportEvent?: (event: string, data?: any) => void;
}) {
    const [tabInfos, unreadArticlesCount] = useTabInfos(10, true);

    // TODO ensure currentTopic is present and first in list

    return (
        <div className="flex flex-col gap-4">
            {tabInfos?.map((tabInfo, index) => (
                <TopicGroup
                    darkModeEnabled={darkModeEnabled}
                    {...tabInfo}
                    showTopic={showTopic}
                    reportEvent={reportEvent}
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
    reportEvent = () => {},
}: {
    key: string;
    title: string;
    icon?: ReactNode;
    articles: Article[];
    darkModeEnabled: boolean;
    showTopic: (topic: Topic) => void;
    reportEvent?: (event: string, data?: any) => void;
}) {
    const topic_id = articles[0].topic_id!;

    const rep = useContext(ReplicacheContext);
    const [allTopicArticles, setAllTopicArticles] = useState<Article[]>();
    const [topic, setTopic] = useState<Topic>();
    useEffect(() => {
        rep?.query.listTopicArticles(topic_id).then(setAllTopicArticles);
        rep?.query.getTopic(topic_id).then(setTopic);
    }, [rep]);

    const color = getRandomLightColor(topic_id, darkModeEnabled);

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
                <div className="stats flex gap-2 font-medium">
                    <ReadingProgress
                        className="relative"
                        articleCount={allTopicArticles?.length}
                        readCount={
                            allTopicArticles?.filter(
                                (a) =>
                                    a.reading_progress >=
                                    readingProgressFullClamp
                            )?.length
                        }
                        color={color}
                    />
                </div>
            </div>
            <div
                className="topic-articles rounded-md p-3"
                style={{
                    height: "11.5rem", // article height + padding to prevent size change
                    background: color,
                }}
            >
                <DraggableArticleList
                    articles={articles}
                    articlesToShow={5}
                    sortPosition="topic_sort_position"
                    small
                    reportEvent={reportEvent}
                />
            </div>
        </div>
    );
}
