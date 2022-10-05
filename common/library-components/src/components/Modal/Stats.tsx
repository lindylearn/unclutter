import React, { ReactNode, useContext, useEffect, useState } from "react";
import { subYears } from "date-fns";
import {
    Article,
    readingProgressFullClamp,
    ReplicacheContext,
    Topic,
} from "../../store";
import {
    ArticleActivityCalendar,
    getActivityColor,
    getActivityLevel,
    InlineProgressCircle,
} from "../Charts";
import {
    getRandomLightColor,
    getWeekNumber,
    getWeekStart,
    subtractWeeks,
} from "../../common";
import { useArticleGroups } from "../ArticleList";
import { TopicEmoji } from "../TopicTag";
import clsx from "clsx";
import { BigNumber, ResourceIcon, ResourceStat } from "./numbers";

export default function StatsModalTab({
    articleCount,
    darkModeEnabled,
    defaultWeekOverlay = 1,
    showTopic,
}: {
    articleCount?: number;
    darkModeEnabled: boolean;
    defaultWeekOverlay?: number;
    showTopic: (topic: Topic) => void;
}) {
    const rep = useContext(ReplicacheContext);

    const [selectedDate, setSelectedDate] = useState<Date>();
    const [allArticles, setAllArticles] = useState<Article[]>();
    useEffect(() => {
        if (!rep) {
            return;
        }
        rep.query.listRecentArticles().then(setAllArticles);
    }, [rep]);

    const [end, setEnd] = useState<Date>(new Date());
    const [start, setStart] = useState<Date>(
        subtractWeeks(getWeekStart(new Date()), defaultWeekOverlay)
    );

    return (
        <div className="animate-fadein relative flex flex-col gap-4">
            <div className="absolute top-0 right-0 flex cursor-pointer items-center gap-2 rounded-md bg-stone-50 px-2 py-1 font-medium dark:bg-neutral-800">
                <svg className="h-4" viewBox="0 0 512 512">
                    <path
                        fill="currentColor"
                        d="M0 73.7C0 50.67 18.67 32 41.7 32H470.3C493.3 32 512 50.67 512 73.7C512 83.3 508.7 92.6 502.6 100L336 304.5V447.7C336 465.5 321.5 480 303.7 480C296.4 480 289.3 477.5 283.6 472.1L191.1 399.6C181.6 392 176 380.5 176 368.3V304.5L9.373 100C3.311 92.6 0 83.3 0 73.7V73.7zM54.96 80L218.6 280.8C222.1 285.1 224 290.5 224 296V364.4L288 415.2V296C288 290.5 289.9 285.1 293.4 280.8L457 80H54.96z"
                    />
                </svg>
                Last 2 weeks
            </div>

            <NumberStats
                articleCount={articleCount}
                allArticles={allArticles}
                darkModeEnabled={darkModeEnabled}
            />
            <ArticleActivityCalendar
                articles={allArticles}
                onSelectDate={setSelectedDate}
                darkModeEnabled={darkModeEnabled}
                start={start}
                setStart={setStart}
                defaultWeekOverlay={defaultWeekOverlay}
            />
            <WeekDetails
                start={start}
                end={end}
                allArticles={allArticles}
                selectedDate={selectedDate}
                darkModeEnabled={darkModeEnabled}
                showTopic={showTopic}
            />
        </div>
    );
}

function NumberStats({
    articleCount,
    allArticles,
    darkModeEnabled,
}: {
    articleCount?: number;
    allArticles?: Article[];
    darkModeEnabled: boolean;
}) {
    // const [weekArticles, setWeekArticles] = useState<number>();
    // useEffect(() => {
    //     if (!allArticles) {
    //         return;
    //     }

    //     const currentWeek = getWeekNumber(new Date());

    //     let weekArticles = 0;
    //     allArticles?.map((a) => {
    //         const date = new Date(a.time_added * 1000);

    //         if (getWeekNumber(date) === currentWeek) {
    //             weekArticles += 1;
    //         }
    //     });

    //     setWeekArticles(weekArticles);
    // }, [allArticles]);

    const rep = useContext(ReplicacheContext);
    const [topicsCount, setTopicsCount] = useState<number>();
    useEffect(() => {
        rep?.query
            .listTopics()
            .then((topics) =>
                setTopicsCount(topics.filter((t) => !!t.group_id).length)
            );
    }, [rep]);

    return (
        <div className="grid grid-cols-5 gap-4">
            <BigNumber
                value={
                    allArticles?.filter(
                        (a) => a.reading_progress >= readingProgressFullClamp
                    ).length
                }
                tag="read articles"
                icon={<ResourceIcon type="articles_completed" large />}
            />
            <BigNumber
                value={articleCount}
                tag="total articles"
                icon={<ResourceIcon type="articles" large />}
            />

            {/* <BigNumber
                value={0}
                tag="total highlights"
                icon={
                    <svg className="h-5" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M320 62.06L362.7 19.32C387.7-5.678 428.3-5.678 453.3 19.32L492.7 58.75C517.7 83.74 517.7 124.3 492.7 149.3L229.5 412.5C181.5 460.5 120.3 493.2 53.7 506.5L28.71 511.5C20.84 513.1 12.7 510.6 7.03 504.1C1.356 499.3-1.107 491.2 .4662 483.3L5.465 458.3C18.78 391.7 51.52 330.5 99.54 282.5L286.1 96L272.1 82.91C263.6 73.54 248.4 73.54 239 82.91L136.1 184.1C127.6 194.3 112.4 194.3 103 184.1C93.66 175.6 93.66 160.4 103 151L205.1 48.97C233.2 20.85 278.8 20.85 306.9 48.97L320 62.06zM320 129.9L133.5 316.5C94.71 355.2 67.52 403.1 54.85 457.2C108 444.5 156.8 417.3 195.5 378.5L382.1 192L320 129.9z"
                        />
                    </svg>
                }
            /> */}
            <BigNumber
                value={topicsCount}
                tag="article topics"
                icon={<ResourceIcon type="links" large />}
            />
            {/* <BigNumber value={weekArticles} target={7} tag="read this week" />
            <BigNumber value={0} target={7} tag="highlighted this week" /> */}
        </div>
    );
}

function WeekDetails({
    start,
    end,
    selectedDate,
    allArticles,
    darkModeEnabled,
    showTopic,
}: {
    start: Date;
    end: Date;
    selectedDate?: Date;
    allArticles?: Article[];
    darkModeEnabled: boolean;
    showTopic: (topic: Topic) => void;
}) {
    const [weekArticles, setWeekArticles] = useState<Article[]>([]);
    useEffect(() => {
        if (!allArticles) {
            return;
        }

        const weekArticles = allArticles.filter(
            (a) =>
                a.time_added * 1000 >= start.getTime() &&
                a.time_added * 1000 < end.getTime()
        );
        setWeekArticles(weekArticles);
    }, [allArticles, start, end]);

    const groups = useArticleGroups(
        weekArticles,
        false,
        "topic_size",
        "recency_order",
        undefined
    );

    // if (!start || !end || !groups) {
    //     return <></>;
    // }

    return (
        <div className="animate-fadein">
            {/* <div className="mb-2 ml-0.5 flex items-center gap-2 font-medium">
                <svg className="w-4" viewBox="0 0 448 512">
                    <path
                        fill="currentColor"
                        d="M152 64H296V24C296 10.75 306.7 0 320 0C333.3 0 344 10.75 344 24V64H384C419.3 64 448 92.65 448 128V448C448 483.3 419.3 512 384 512H64C28.65 512 0 483.3 0 448V128C0 92.65 28.65 64 64 64H104V24C104 10.75 114.7 0 128 0C141.3 0 152 10.75 152 24V64zM48 448C48 456.8 55.16 464 64 464H384C392.8 464 400 456.8 400 448V192H48V448z"
                    />
                </svg>
                <span>
                    {formatDate(start)} to {formatDate(end)}
                </span>
            </div> */}

            <div className="grid grid-cols-5 gap-4">
                {groups?.map(([topic_id, selectedArticles]) => (
                    <TopicStat
                        key={topic_id}
                        topic_id={topic_id}
                        selectedArticles={selectedArticles}
                        totalArticleCount={
                            allArticles?.filter((a) => a.topic_id === topic_id)
                                .length
                        }
                        darkModeEnabled={darkModeEnabled}
                        showTopic={showTopic}
                    />
                ))}
            </div>

            {/* <div className="rounded-md bg-stone-50 p-3">
                <StaticArticleList articles={weekArticles} small />
            </div> */}
        </div>
    );
}

function TopicStat({
    topic_id,
    selectedArticles,
    totalArticleCount,
    darkModeEnabled,
    showTopic,
}: {
    topic_id: string;
    selectedArticles: Article[];
    totalArticleCount?: number;
    darkModeEnabled: boolean;
    showTopic: (topic: Topic) => void;
}) {
    const [topic, setTopic] = useState<Topic>();
    const rep = useContext(ReplicacheContext);
    useEffect(() => {
        rep?.query.getTopic(topic_id).then(setTopic);
    }, [rep, topic_id]);

    const addedCount = selectedArticles.length;
    const readCount = selectedArticles.filter(
        (a) => a.reading_progress >= readingProgressFullClamp
    ).length;
    // const unreadCount = addedCount - readCount;

    const activityLevel = getActivityLevel(addedCount);

    return (
        <div
            className={clsx(
                "flex cursor-pointer select-none flex-col items-center gap-1 overflow-hidden rounded-md bg-stone-50 p-3 transition-all hover:scale-[97%] dark:bg-neutral-800",
                activityLevel === 4 && "dark:text-stone-800"
            )}
            style={{
                background: getActivityColor(
                    activityLevel,
                    darkModeEnabled || false
                ),
                // background: getRandomLightColor(topic_id),
            }}
            onClick={() => showTopic(topic!)}
        >
            <div className="flex max-w-full items-center overflow-hidden font-medium">
                {topic?.emoji && (
                    <TopicEmoji emoji={topic?.emoji} className="w-4" />
                )}
                <div className="overflow-hidden overflow-ellipsis whitespace-nowrap">
                    {topic?.name || topic_id}
                </div>
            </div>

            <div className="flex gap-3">
                <ResourceStat
                    type="articles_completed"
                    value={readCount}
                    showPlus
                    className={clsx(readCount === 0 && "opacity-0")}
                />
                <ResourceStat
                    type="articles"
                    value={addedCount}
                    showPlus
                    className={clsx(addedCount === 0 && "opacity-0")}
                />
                {/* <ResourceStat type="highlights" value={0} showPlus /> */}
            </div>
        </div>
    );
}
