import React, { useMemo } from "react";
import { ActivityCalendar, CalendarData, Level, Theme } from "./ActivityCalendar";
import { eachDayOfInterval, subMonths } from "date-fns";

import { Article } from "../../store";
import { getWeekStartByLocale } from "weekstart";

export function ArticleActivityCalendar({
    darkModeEnabled,
    articles,
    startWeeksAgo,
    setStartWeeksAgo,
    enableOverlay = false,
    defaultWeekOverlay,
    reportEvent = () => {},
}: {
    darkModeEnabled: boolean;
    articles?: Article[];
    startWeeksAgo?: number;
    setStartWeeksAgo?: (weeksAgo: number) => void;
    enableOverlay?: boolean;
    defaultWeekOverlay?: number;
    reportEvent?: (event: string, data?: any) => void;
}) {
    const weekStart = useMemo(() => getWeekStartByLocale(navigator.language), []);
    const data = useMemo(() => {
        if (!articles || !weekStart) {
            return null;
        }
        return getActivityData(articles, weekStart);
    }, [articles, weekStart]);

    function changeWeekOffset(offset) {
        const newValue = -offset;
        if (newValue !== startWeeksAgo) {
            setStartWeeksAgo!(newValue);
            reportEvent("changeStatsTimeWindow", { startWeeksAgo: newValue });
        }
    }

    if (data === null) {
        return <></>;
    }

    return (
        <div className="animate-fadein mt-[5px]">
            <ActivityCalendar
                data={data || []}
                enableOverlay={enableOverlay}
                startWeekOffset={defaultWeekOverlay ? -defaultWeekOverlay - 1 : undefined}
                onChangeWeekOffset={changeWeekOffset}
                theme={getColorLevels(darkModeEnabled)}
                overlayColor={
                    darkModeEnabled ? "rgb(232, 230, 227, 0.1)" : "rgb(212, 212, 212, 0.3)"
                }
                labels={{
                    legend: { less: "Fewer articles read", more: "More" },
                }}
                weekStart={weekStart}
                hideTotalCount
                loading={data === null}
                hideColorLegend
                // hideMonthLabels
                // showWeekdayLabels
                eventHandlers={
                    {
                        // onClick: (event) => (data) => {
                        //     onSelectDate(new Date(data.date));
                        // },
                        // onMouseEnter: (event) => (data) =>
                        //     console.log("mouseEnter"),
                    }
                }
            />
        </div>
    );
}

export function getActivityData(articles: Article[], weekStart: number): CalendarData {
    const since = subMonths(new Date(), 10);
    since.setDate(weekStart); // fill first row

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

    articles
        .filter((a) => a.time_added * 1000 >= since.getTime())
        .forEach((a) => {
            const date = new Date(a.time_added * 1000).toISOString().split("T")[0];

            dateCounts[date] += 1;
        });

    return Object.entries(dateCounts).map(([date, count]) => ({
        date,
        count,
        level: getActivityLevel(count),
    }));
}

export function getActivityColor(activityLevel: Level, darkModeEnabled: boolean) {
    return getColorLevels(darkModeEnabled)[`level${activityLevel}`];
}

export function getActivityLevel(value: number): Level {
    if (value === 0) {
        return 0;
    } else if (value <= 2) {
        return 1;
    } else if (value <= 4) {
        return 2;
    } else if (value <= 6) {
        return 3;
    } else {
        return 4;
    }
}

function getColorLevels(darkModeEnabled: boolean): Theme {
    return darkModeEnabled
        ? {
              level0: "#262626", // bg-neutral-800

              // same as light now
              level1: "rgb(250, 204, 21, 0.3)",
              level2: "rgb(250, 204, 21, 0.5)",
              level3: "rgb(250, 204, 21, 0.7)",
              level4: "rgb(250, 204, 21, 0.9)",
          }
        : {
              level0: "#fafaf9", // bg-stone-50
              level1: "rgb(250, 204, 21, 0.3)",
              level2: "rgb(250, 204, 21, 0.5)",
              level3: "rgb(250, 204, 21, 0.7)",
              level4: "rgb(250, 204, 21, 0.9)",
          };
}
