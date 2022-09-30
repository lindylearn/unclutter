import React, { ReactNode, useContext, useEffect, useState } from "react";
import { subYears } from "date-fns";
import { Article, ReplicacheContext, Topic } from "../../store";
import { ActivityCalendar } from "../Charts";
import { getRandomLightColor, getWeekNumber, getWeekStart } from "../../common";
import { useArticleGroups } from "../ArticleList";
import { TopicEmoji } from "../TopicTag";

export default function StatsModalTab({ articleCount, darkModeEnabled }) {
    const rep = useContext(ReplicacheContext);

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const [allArticles, setAllArticles] = useState<Article[]>();
    useEffect(() => {
        if (!rep) {
            return;
        }
        rep.query
            .listRecentArticles(subYears(new Date(), 1).getTime())
            .then(setAllArticles);
    }, [rep]);

    return (
        <div className="animate-fadein flex flex-col gap-4">
            <NumberStats
                articleCount={articleCount}
                allArticles={allArticles}
            />
            <ActivityCalendar
                darkModeEnabled={darkModeEnabled}
                articles={allArticles}
                onSelectDate={setSelectedDate}
            />
            <WeekDetails
                allArticles={allArticles}
                selectedDate={selectedDate}
            />
        </div>
    );
}

function NumberStats({
    articleCount,
    allArticles,
}: {
    articleCount: number;
    allArticles?: Article[];
}) {
    const [weekArticles, setWeekArticles] = useState<number>();
    useEffect(() => {
        if (!allArticles) {
            return;
        }

        const currentWeek = getWeekNumber(new Date());

        let weekArticles = 0;
        allArticles?.map((a) => {
            const date = new Date(a.time_added * 1000);

            if (getWeekNumber(date) === currentWeek) {
                weekArticles += 1;
            }
        });

        setWeekArticles(weekArticles);
    }, [allArticles]);

    return (
        <div className="flex gap-3">
            <BigNumber value={articleCount} tag="saved articles" />
            <BigNumber value={0} tag="highlights" />
            <BigNumber value={weekArticles} target={7} tag="read this week" />
            <BigNumber value={0} target={7} tag="highlighted this week" />
        </div>
    );
}

function BigNumber({
    value,
    target = undefined,
    tag,
    colorOverride,
}: {
    value?: number;
    target?: number;
    tag: ReactNode;
    colorOverride?: string;
}) {
    return (
        <div className="relative flex cursor-pointer flex-col items-center overflow-hidden rounded-md bg-stone-50 p-3 transition-all hover:scale-[97%] dark:bg-neutral-800">
            {value !== undefined && target !== undefined && (
                <div
                    className="bg-lindy dark:bg-lindyDark absolute top-0 left-0 h-full w-full opacity-90"
                    style={{
                        background: colorOverride,
                        width: `${Math.min(1, value / target) * 100}%`,
                    }}
                />
            )}
            <div className="font-title z-10 h-[2rem] text-2xl font-bold">
                <span className="">{value}</span>
                {target && (
                    <span className="light:text-gray-400 text-base">
                        {" "}
                        / {target}
                    </span>
                )}
            </div>
            <div className="z-10">{tag}</div>
        </div>
    );
}

function WeekDetails({
    selectedDate,
    allArticles,
}: {
    selectedDate: Date;
    allArticles?: Article[];
}) {
    const [start, setStart] = useState<Date>();
    const [end, setEnd] = useState<Date>();
    const [weekArticles, setWeekArticles] = useState<Article[]>([]);
    useEffect(() => {
        if (!allArticles) {
            return;
        }

        const start = getWeekStart(selectedDate || new Date());
        const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
        setStart(start);
        setEnd(end);

        const weekArticles = allArticles.filter(
            (a) =>
                a.time_added * 1000 >= start.getTime() &&
                a.time_added * 1000 < end.getTime()
        );
        setWeekArticles(weekArticles);
    }, [selectedDate, allArticles]);

    const groups = useArticleGroups(
        weekArticles,
        false,
        "topic_size",
        "recency_order",
        undefined
    );
    // console.log(groups);

    if (!start || !end || !groups) {
        return <></>;
    }

    return (
        <div className="animate-fadein">
            {/* <h2 className="mb-3 ml-0.5 flex items-center gap-2 font-medium">
                <svg className="w-4" viewBox="0 0 448 512">
                    <path
                        fill="currentColor"
                        d="M152 64H296V24C296 10.75 306.7 0 320 0C333.3 0 344 10.75 344 24V64H384C419.3 64 448 92.65 448 128V448C448 483.3 419.3 512 384 512H64C28.65 512 0 483.3 0 448V128C0 92.65 28.65 64 64 64H104V24C104 10.75 114.7 0 128 0C141.3 0 152 10.75 152 24V64zM48 448C48 456.8 55.16 464 64 464H384C392.8 464 400 456.8 400 448V192H48V448z"
                    />
                </svg>
                <span>
                    Saved {weekArticles.length} articles across {groups?.length}{" "}
                    topics
                </span>
            </h2> */}

            <div className="grid grid-cols-5 gap-3">
                {groups?.map(([topic_id, selectedArticles]) => (
                    <TopicStat
                        key={topic_id}
                        topic_id={topic_id}
                        selectedArticles={selectedArticles}
                        totalArticleCount={
                            allArticles?.filter((a) => a.topic_id === topic_id)
                                .length
                        }
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
}: {
    topic_id: string;
    selectedArticles: Article[];
    totalArticleCount?: number;
}) {
    const [topic, setTopic] = useState<Topic>();
    const rep = useContext(ReplicacheContext);
    useEffect(() => {
        rep?.query.getTopic(topic_id).then(setTopic);
    }, [rep, topic_id]);

    return (
        <BigNumber
            value={selectedArticles.length}
            target={totalArticleCount}
            tag={
                <div className="z-10 flex items-center">
                    <TopicEmoji emoji={topic?.emoji!} className="w-4" />
                    <span>{topic?.name}</span>
                </div>
            }
            colorOverride={getRandomLightColor(topic_id)}
        />
    );
}

function getDomain(url: string): string {
    return new URL(url).hostname.replace("www.", "");
}

function formatDate(date: Date): string {
    return date?.toDateString().split(" ").slice(1, 3).join(" ");
}
