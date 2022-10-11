import partition from "lodash/partition";
import {
    DraggableArticleList,
    useTabInfos,
    TabInfo,
    useArticleGroups,
} from "../../components";
import React, { ReactNode, useContext, useEffect, useState } from "react";
import { getRandomLightColor, reportEventContentScript } from "../../common";
import {
    Article,
    readingProgressFullClamp,
    ReplicacheContext,
    Topic,
} from "../../store";
import { ReadingProgress, ResourceIcon } from "./numbers";
import { UserInfo } from "../../store/user";
import clsx from "clsx";

export default function RecentModalTab({
    userInfo,
    currentTopic,
    darkModeEnabled,
    showTopic,
    reportEvent = () => {},
}: {
    userInfo: UserInfo;
    currentTopic?: Topic;
    darkModeEnabled: boolean;
    showTopic: (topic: Topic) => void;
    reportEvent?: (event: string, data?: any) => void;
}) {
    const [onlyUnread, setOnlyUnread] = useState(true);
    const [lastFirst, setLastFirst] = useState(true);

    let [tabInfos, setTabInfos] = useState<TabInfo[]>();
    if (userInfo.topicsEnabled) {
        tabInfos = useTabInfos(10, onlyUnread, !lastFirst, null)[0];
    } else {
        const rep = useContext(ReplicacheContext);
        useEffect(() => {
            rep?.query
                .listRecentArticles(undefined, onlyUnread ? "unread" : "all")
                .then((articles) => {
                    if (lastFirst) {
                        articles.reverse();
                    }
                    // const [readArticles, unreadArticles] = partition(
                    //     articles,
                    //     (a) => a.reading_progress >= readingProgressFullClamp
                    // );
                    setTabInfos([
                        {
                            key: "queue",
                            title: "Reading queue",
                            articles: [],
                            articleLines: 1,
                        },
                        {
                            key: "unread",
                            title: "Articles",
                            articles: articles,
                            articleLines: 5,
                        },
                    ]);
                });
        }, [onlyUnread, lastFirst]);
    }

    // TODO ensure currentTopic is present and first in list

    return (
        <div className="flex flex-col gap-4">
            <PageFilters
                onlyUnread={onlyUnread}
                lastFirst={lastFirst}
                setOnlyUnread={setOnlyUnread}
                setLastFirst={setLastFirst}
            />

            {tabInfos?.map((tabInfo) => {
                return (
                    // TopicGroup
                    <ArticleGroup
                        {...tabInfo}
                        key={tabInfo.key}
                        groupKey={tabInfo.key}
                        darkModeEnabled={darkModeEnabled}
                        // showTopic={showTopic}
                        reportEvent={reportEvent}
                    />
                );
            })}
        </div>
    );
}

function PageFilters({
    onlyUnread,
    lastFirst,
    setOnlyUnread,
    setLastFirst,
}: {
    onlyUnread: boolean;
    lastFirst: boolean;
    setOnlyUnread: (state: boolean) => void;
    setLastFirst: (state: boolean) => void;
}) {
    return (
        <div className="flex justify-start gap-3">
            <FilterButton
                title={onlyUnread ? "Unread articles" : "Read articles"}
                icon={
                    <ResourceIcon
                        type={onlyUnread ? "articles" : "articles_completed"}
                    />
                }
                onClick={() => setOnlyUnread(!onlyUnread)}
            />
            <FilterButton
                title={lastFirst ? "Last added" : "Oldest first"}
                icon={
                    lastFirst ? (
                        <svg className="h-4" viewBox="0 0 512 512">
                            <path
                                fill="currentColor"
                                d="M416 320h-96c-17.6 0-32 14.4-32 32v96c0 17.6 14.4 32 32 32h96c17.6 0 32-14.4 32-32v-96C448 334.4 433.6 320 416 320zM400 432h-64v-64h64V432zM480 32h-160c-17.67 0-32 14.33-32 32v160c0 17.67 14.33 32 32 32h160c17.67 0 32-14.33 32-32V64C512 46.33 497.7 32 480 32zM464 208h-128v-128h128V208zM145.6 39.37c-9.062-9.82-26.19-9.82-35.25 0L14.38 143.4c-9 9.758-8.406 24.96 1.344 33.94C20.35 181.7 26.19 183.8 32 183.8c6.469 0 12.91-2.594 17.62-7.719L104 117.1v338.9C104 469.2 114.8 480 128 480s24-10.76 24-24.02V117.1l54.37 58.95C215.3 185.8 230.5 186.5 240.3 177.4C250 168.4 250.6 153.2 241.6 143.4L145.6 39.37z"
                            />
                        </svg>
                    ) : (
                        <svg className="h-4" viewBox="0 0 512 512">
                            <path
                                fill="currentColor"
                                d="M480 32h-160c-17.67 0-32 14.33-32 32v160c0 17.67 14.33 32 32 32h160c17.67 0 32-14.33 32-32V64C512 46.33 497.7 32 480 32zM464 208h-128v-128h128V208zM416 320h-96c-17.6 0-32 14.4-32 32v96c0 17.6 14.4 32 32 32h96c17.6 0 32-14.4 32-32v-96C448 334.4 433.6 320 416 320zM400 432h-64v-64h64V432zM206.4 335.1L152 394.9V56.02C152 42.76 141.3 32 128 32S104 42.76 104 56.02v338.9l-54.37-58.95c-4.719-5.125-11.16-7.719-17.62-7.719c-5.812 0-11.66 2.094-16.28 6.375c-9.75 8.977-10.34 24.18-1.344 33.94l95.1 104.1c9.062 9.82 26.19 9.82 35.25 0l95.1-104.1c9-9.758 8.406-24.96-1.344-33.94C230.5 325.5 215.3 326.2 206.4 335.1z"
                            />
                        </svg>
                    )
                }
                onClick={() => setLastFirst(!lastFirst)}
            />
        </div>
    );
}

function FilterButton({
    title,
    icon,
    onClick,
}: {
    title: string;
    icon: ReactNode;
    onClick: () => void;
}) {
    return (
        <div
            className="flex cursor-pointer select-none items-center gap-2 rounded-md bg-stone-50 px-2 py-1 font-medium transition-transform hover:scale-[97%] dark:bg-neutral-800"
            onClick={onClick}
        >
            {icon}
            {title}
        </div>
    );
}

function TopicGroup(
    props: TabInfo & {
        darkModeEnabled: boolean;
        showTopic: (topic: Topic) => void;
        reportEvent?: (event: string, data?: any) => void;
    }
) {
    const rep = useContext(ReplicacheContext);

    const [groupArticles, setGroupArticles] = useState<Article[]>([]);
    const [topic, setTopic] = useState<Topic>();
    const [color, setColor] = useState<string>();
    useEffect(() => {
        const topic_id = props.articles[0]?.topic_id!;
        rep?.query.listTopicArticles(topic_id).then(setGroupArticles);
        rep?.query.getTopic(topic_id).then(setTopic);

        setColor(getRandomLightColor(topic_id, props.darkModeEnabled));
    }, [rep]);

    return (
        <ArticleGroup
            {...props}
            groupKey={props.key}
            articles={groupArticles}
            articleLines={1}
            color={color}
            onTitleClick={() => props.showTopic(topic!)}
        />
    );
}

function ArticleGroup({
    groupKey,
    title,
    icon,
    color,
    articles,
    articleLines = 1,
    darkModeEnabled,
    onTitleClick,
    reportEvent = () => {},
}: {
    groupKey: string;
    title: string;
    icon?: ReactNode;
    color?: string;
    articles: Article[];
    articleLines?: number;
    darkModeEnabled: boolean;
    onTitleClick?: () => void;
    reportEvent?: (event: string, data?: any) => void;
}) {
    return (
        <div className="topic animate-fadein">
            <div className="topic-header mx-0.5 mb-2 flex justify-between">
                <h2
                    className={clsx(
                        "title flex select-none items-center gap-2 font-medium",
                        onTitleClick &&
                            "cursor-pointer transition-transform hover:scale-[96%]"
                    )}
                    onClick={onTitleClick}
                >
                    {icon}
                    {title}
                </h2>
                <div className="stats flex gap-2 font-medium">
                    <ReadingProgress
                        className="relative"
                        articleCount={articles?.length}
                        readCount={
                            articles?.filter(
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
                className="topic-articles relative rounded-md p-3"
                style={{
                    height: `${
                        11.5 * articleLines - 0.75 * (articleLines - 1)
                    }rem`, // article height + padding to prevent size change
                    background: getRandomLightColor(groupKey, darkModeEnabled),
                }}
            >
                <DraggableArticleList
                    articles={articles}
                    articlesToShow={5 * articleLines}
                    sortPosition="topic_sort_position"
                    small
                    reportEvent={reportEvent}
                />
                {title === "Reading queue" && (
                    <div className="absolute top-0 left-0 flex h-full w-full select-none items-center justify-center">
                        Drag articles here to add them to your queue
                    </div>
                )}
            </div>
        </div>
    );
}
