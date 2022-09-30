import React, { useContext, useEffect, useMemo, useState } from "react";
import { subYears, subMonths, subWeeks } from "date-fns";
import { Article, ReplicacheContext } from "../../store";
import { ActivityCalendar } from "../Charts";
import { getWeekNumber, getWeekStart } from "../../common";
import { StaticArticleList } from "../ArticleList";

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
        <div className="flex flex-col gap-5">
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
}: {
    value?: number;
    target?: number;
    tag: string;
}) {
    return (
        <div className="relative flex cursor-pointer flex-col items-center rounded-md bg-stone-50 p-3 transition-all hover:scale-[97%] dark:bg-neutral-800">
            {value !== undefined && target !== undefined && (
                <div
                    className="bg-lindy dark:bg-lindyDark absolute top-0 left-0 h-full w-full rounded-md opacity-90"
                    style={{ width: `${Math.min(1, value / target) * 100}%` }}
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
    const [weekArticles, setWeekArticles] = useState<Article[]>([]);
    useEffect(() => {
        if (!allArticles) {
            return;
        }

        const start = getWeekStart(selectedDate || new Date());
        const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

        const weekArticles = allArticles.filter(
            (a) =>
                a.time_added * 1000 >= start.getTime() &&
                a.time_added * 1000 < end.getTime()
        );
        setWeekArticles(weekArticles);
    }, [selectedDate, allArticles]);

    return (
        <div className="">
            {/* <h2 className="mb-3">Sep 26 to now:</h2> */}

            <div className="rounded-md bg-stone-50 p-3">
                <StaticArticleList articles={weekArticles} small />
            </div>

            {/* <div className="grid grid-cols-6 rounded-md bg-stone-50 p-3">
                {weekArticles?.map((a) => (
                    <>
                        <div className="text-stone-500">{getDomain(a.url)}</div>
                        <div className="col-span-4">{a.title}</div>
                        <div className="text-stone-500">
                            {a.reading_progress * 100}%
                        </div>
                    </>
                ))}
            </div> */}
        </div>
    );
}

function getDomain(url: string): string {
    return new URL(url).hostname.replace("www.", "");
}
