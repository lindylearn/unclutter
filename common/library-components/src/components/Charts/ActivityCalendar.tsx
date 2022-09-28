import React, { useMemo } from "react";
import ActivityCalendarModule, {
    CalendarData,
    Level,
} from "react-activity-calendar";
import { eachDayOfInterval, subYears } from "date-fns";

import { Article } from "../../store";

export function ActivityCalendar({
    darkModeEnabled,
    articles,
}: {
    darkModeEnabled: boolean;
    articles?: Article[];
}) {
    const data = useMemo(() => {
        if (!articles) {
            return null;
        }
        return getActivityData(articles);
    }, [articles]);

    if (data === null) {
        return <></>;
    }

    return (
        <div className="animate-fadein mx-auto mt-3 max-w-[860px] pr-2 text-gray-500 dark:text-neutral-600">
            <ActivityCalendarModule
                data={data || []}
                theme={
                    darkModeEnabled
                        ? {
                              level0: "#262626", // bg-neutral-800

                              level1: "rgb(237, 215, 91, 0.1)",
                              level2: "rgb(237, 215, 91, 0.3)",
                              level3: "rgb(237, 215, 91, 0.6)",
                              level4: "rgb(237, 215, 91, 1.0)",
                          }
                        : {
                              level0: "#fafaf9", // bg-stone-50
                              level1: "rgb(237, 215, 91, 0.3)",
                              level2: "rgb(237, 215, 91, 0.5)",
                              level3: "rgb(237, 215, 91, 0.7)",
                              level4: "rgb(237, 215, 91, 1.0)",
                          }
                }
                labels={{
                    legend: { less: "Fewer articles read", more: "More" },
                }}
                blockRadius={3}
                hideTotalCount
                loading={data === null}
                // hideColorLegend
                // hideMonthLabels
                // showWeekdayLabels
            />
        </div>
    );
}

export function getActivityData(articles: Article[]): CalendarData {
    const since = subYears(new Date(), 1);

    const dateCounts: { [date: string]: number } = {};
    eachDayOfInterval({
        start: since,
        end: new Date(),
    })
        .concat([new Date()])
        .map((date) => {
            const dateStr = date.toISOString().split("T")[0];
            dateCounts[dateStr] = 0;
        });

    articles.forEach((a) => {
        const date = new Date(a.time_added * 1000).toISOString().split("T")[0];

        dateCounts[date] += 1;
    });

    return Object.entries(dateCounts).map(([date, count]) => ({
        date,
        count,
        level: Math.min(4, count) as Level,
    }));
}
