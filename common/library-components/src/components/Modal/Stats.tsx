import React, { useContext, useEffect, useMemo, useState } from "react";
import { subYears, subMonths, subWeeks } from "date-fns";
import { Article, ReplicacheContext } from "../../store";
import { ActivityCalendar } from "../Charts";
import { getWeekNumber } from "../../common";

export default function StatsModalTab({ articleCount, darkModeEnabled }) {
    const rep = useContext(ReplicacheContext);

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
            <h1 className="text-lg font-medium">
                <svg
                    className="mr-1.5 inline-block w-4 align-sub"
                    viewBox="0 0 448 512"
                >
                    <path
                        fill="currentColor"
                        d="M152 64H296V24C296 10.75 306.7 0 320 0C333.3 0 344 10.75 344 24V64H384C419.3 64 448 92.65 448 128V448C448 483.3 419.3 512 384 512H64C28.65 512 0 483.3 0 448V128C0 92.65 28.65 64 64 64H104V24C104 10.75 114.7 0 128 0C141.3 0 152 10.75 152 24V64zM48 448C48 456.8 55.16 464 64 464H384C392.8 464 400 456.8 400 448V192H48V448z"
                    />
                </svg>
                Weekly progress
            </h1>

            <NumberStats
                articleCount={articleCount}
                allArticles={allArticles}
            />
            {/* <AreaChart
                darkModeEnabled={darkModeEnabled}
                articles={allArticles}
            /> */}

            <ActivityCalendar
                darkModeEnabled={darkModeEnabled}
                articles={allArticles}
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
