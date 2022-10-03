import React, { ReactNode, useContext, useEffect, useState } from "react";
import { subYears } from "date-fns";
import { Article, ReplicacheContext, Topic } from "../../store";
import {
    ArticleActivityCalendar,
    getActivityColor,
    getActivityLevel,
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

export default function StatsModalTab({
    articleCount,
    darkModeEnabled,
}: {
    articleCount?: number;
    darkModeEnabled: boolean;
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

    const [end, setEnd] = useState<Date>(
        getWeekStart(selectedDate || new Date())
    );
    const [start, setStart] = useState<Date>(subtractWeeks(end, 2));

    return (
        <div className="animate-fadein flex flex-col gap-4">
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
            />
            <WeekDetails
                start={start}
                end={end}
                allArticles={allArticles}
                selectedDate={selectedDate}
                darkModeEnabled={darkModeEnabled}
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
        rep?.query.listTopics().then((topics) => setTopicsCount(topics.length));
    }, [rep]);

    return (
        <div className="grid grid-cols-5 gap-4">
            <BigNumber
                value={articleCount}
                tag="total articles"
                icon={
                    <svg className="h-5" viewBox="0 0 576 512">
                        <path
                            fill="currentColor"
                            d="M540.9 56.77C493.8 39.74 449.6 31.58 410.9 32.02C352.2 32.96 308.3 50 288 59.74C267.7 50 223.9 32.98 165.2 32.04C125.8 31.35 82.18 39.72 35.1 56.77C14.02 64.41 0 84.67 0 107.2v292.1c0 16.61 7.594 31.95 20.84 42.08c13.73 10.53 31.34 13.91 48.2 9.344c118.1-32 202 22.92 205.5 25.2C278.6 478.6 283.3 480 287.1 480s9.37-1.359 13.43-4.078c3.516-2.328 87.59-57.21 205.5-25.25c16.92 4.563 34.5 1.188 48.22-9.344C568.4 431.2 576 415.9 576 399.2V107.2C576 84.67 561.1 64.41 540.9 56.77zM264 416.8c-27.86-11.61-69.84-24.13-121.4-24.13c-26.39 0-55.28 3.281-86.08 11.61C53.19 405.3 50.84 403.9 50 403.2C48 401.7 48 399.8 48 399.2V107.2c0-2.297 1.516-4.531 3.594-5.282c40.95-14.8 79.61-22.36 112.8-21.84C211.3 80.78 246.8 93.75 264 101.5V416.8zM528 399.2c0 .5938 0 2.422-2 3.969c-.8438 .6407-3.141 2.063-6.516 1.109c-90.98-24.6-165.4-5.032-207.5 12.53v-315.3c17.2-7.782 52.69-20.74 99.59-21.47c32.69-.5157 71.88 7.047 112.8 21.84C526.5 102.6 528 104.9 528 107.2V399.2z"
                        />
                    </svg>
                }
            />
            <BigNumber
                value={0}
                tag="highlights"
                icon={
                    <svg className="h-5" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M320 62.06L362.7 19.32C387.7-5.678 428.3-5.678 453.3 19.32L492.7 58.75C517.7 83.74 517.7 124.3 492.7 149.3L229.5 412.5C181.5 460.5 120.3 493.2 53.7 506.5L28.71 511.5C20.84 513.1 12.7 510.6 7.03 504.1C1.356 499.3-1.107 491.2 .4662 483.3L5.465 458.3C18.78 391.7 51.52 330.5 99.54 282.5L286.1 96L272.1 82.91C263.6 73.54 248.4 73.54 239 82.91L136.1 184.1C127.6 194.3 112.4 194.3 103 184.1C93.66 175.6 93.66 160.4 103 151L205.1 48.97C233.2 20.85 278.8 20.85 306.9 48.97L320 62.06zM320 129.9L133.5 316.5C94.71 355.2 67.52 403.1 54.85 457.2C108 444.5 156.8 417.3 195.5 378.5L382.1 192L320 129.9z"
                        />
                    </svg>
                }
            />
            <BigNumber value={topicsCount} tag="article topics" />
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
}: {
    start: Date;
    end: Date;
    selectedDate?: Date;
    allArticles?: Article[];
    darkModeEnabled: boolean;
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
    // console.log(groups);

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
}: {
    topic_id: string;
    selectedArticles: Article[];
    totalArticleCount?: number;
    darkModeEnabled: boolean;
}) {
    const [topic, setTopic] = useState<Topic>();
    const rep = useContext(ReplicacheContext);
    useEffect(() => {
        rep?.query.getTopic(topic_id).then(setTopic);
    }, [rep, topic_id]);

    const activityLevel = getActivityLevel(selectedArticles.length);

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
            }}
        >
            <div className="flex max-w-full items-center overflow-hidden">
                <TopicEmoji emoji={topic?.emoji!} className="w-4" />
                <div className="overflow-hidden overflow-ellipsis whitespace-nowrap">
                    {topic?.name}
                </div>
            </div>

            <div className="flex gap-3">
                <ResourceStat type="articles" value={selectedArticles.length} />
                <ResourceStat type="highlights" value={0} />
            </div>
        </div>
    );
}

function BigNumber({
    value,
    target,
    tag,
    colorOverride,
    icon,
    darkModeEnabled,
}: {
    value?: number;
    target?: number;
    tag: ReactNode;
    colorOverride?: string;
    icon?: ReactNode;
    darkModeEnabled?: boolean;
}) {
    return (
        <div className="relative flex cursor-pointer select-none flex-col items-center overflow-hidden rounded-md bg-stone-50 p-3 transition-all hover:scale-[97%] dark:bg-neutral-800">
            {value !== undefined && target !== undefined && (
                <div
                    className="absolute top-0 left-0 h-full w-full opacity-90"
                    style={{
                        background: colorOverride || "rgb(237, 215, 91, 0.6)",
                        width: `${Math.min(1, value / target) * 100}%`,
                    }}
                />
            )}
            <div
                className={clsx(
                    "font-title z-10 flex h-[2rem] items-center gap-1.5 text-2xl font-bold transition-opacity",
                    value === undefined && "opacity-0"
                )}
            >
                {icon}
                <div>
                    {value}
                    {target && (
                        <span className="text-base opacity-20">
                            {" "}
                            / {target}
                        </span>
                    )}
                </div>
            </div>
            <div className="z-10 max-w-full overflow-hidden">{tag}</div>
        </div>
    );
}

export function ResourceStat({
    value,
    type,
    large = false,
}: {
    value?: number;
    type: "articles" | "highlights";
    large?: boolean;
}) {
    return (
        <div
            className={clsx(
                "flex items-center transition-opacity",
                large ? "gap-1.5" : "gap-1",
                value === undefined && "opacity-0"
            )}
        >
            {type === "articles" && (
                <svg
                    className={clsx(large ? "h-5" : "h-4")}
                    viewBox="0 0 576 512"
                >
                    <path
                        fill="currentColor"
                        d="M540.9 56.77C493.8 39.74 449.6 31.58 410.9 32.02C352.2 32.96 308.3 50 288 59.74C267.7 50 223.9 32.98 165.2 32.04C125.8 31.35 82.18 39.72 35.1 56.77C14.02 64.41 0 84.67 0 107.2v292.1c0 16.61 7.594 31.95 20.84 42.08c13.73 10.53 31.34 13.91 48.2 9.344c118.1-32 202 22.92 205.5 25.2C278.6 478.6 283.3 480 287.1 480s9.37-1.359 13.43-4.078c3.516-2.328 87.59-57.21 205.5-25.25c16.92 4.563 34.5 1.188 48.22-9.344C568.4 431.2 576 415.9 576 399.2V107.2C576 84.67 561.1 64.41 540.9 56.77zM264 416.8c-27.86-11.61-69.84-24.13-121.4-24.13c-26.39 0-55.28 3.281-86.08 11.61C53.19 405.3 50.84 403.9 50 403.2C48 401.7 48 399.8 48 399.2V107.2c0-2.297 1.516-4.531 3.594-5.282c40.95-14.8 79.61-22.36 112.8-21.84C211.3 80.78 246.8 93.75 264 101.5V416.8zM528 399.2c0 .5938 0 2.422-2 3.969c-.8438 .6407-3.141 2.063-6.516 1.109c-90.98-24.6-165.4-5.032-207.5 12.53v-315.3c17.2-7.782 52.69-20.74 99.59-21.47c32.69-.5157 71.88 7.047 112.8 21.84C526.5 102.6 528 104.9 528 107.2V399.2z"
                    />
                </svg>
            )}
            {type === "highlights" && (
                <svg
                    className={clsx(large ? "h-5" : "h-4")}
                    viewBox="0 0 512 512"
                >
                    <path
                        fill="currentColor"
                        d="M320 62.06L362.7 19.32C387.7-5.678 428.3-5.678 453.3 19.32L492.7 58.75C517.7 83.74 517.7 124.3 492.7 149.3L229.5 412.5C181.5 460.5 120.3 493.2 53.7 506.5L28.71 511.5C20.84 513.1 12.7 510.6 7.03 504.1C1.356 499.3-1.107 491.2 .4662 483.3L5.465 458.3C18.78 391.7 51.52 330.5 99.54 282.5L286.1 96L272.1 82.91C263.6 73.54 248.4 73.54 239 82.91L136.1 184.1C127.6 194.3 112.4 194.3 103 184.1C93.66 175.6 93.66 160.4 103 151L205.1 48.97C233.2 20.85 278.8 20.85 306.9 48.97L320 62.06zM320 129.9L133.5 316.5C94.71 355.2 67.52 403.1 54.85 457.2C108 444.5 156.8 417.3 195.5 378.5L382.1 192L320 129.9z"
                    />
                </svg>
            )}
            <div
                className={clsx(
                    "font-title font-bold",
                    large ? "text-2xl" : ""
                )}
            >
                {value || 0}
            </div>
        </div>
    );
}

function getDomain(url: string): string {
    return new URL(url).hostname.replace("www.", "");
}

function formatDate(date: Date): string {
    return date?.toDateString().split(" ").slice(1, 3).join(" ");
}
