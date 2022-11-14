import React, { useMemo } from "react";
import { ActivityCalendar, CalendarData, Level, Theme } from "./ActivityCalendar";
import { eachDayOfInterval, subYears } from "date-fns";

import { Article } from "../../store";

export function ArticleActivityCalendar({
    darkModeEnabled,
    articles,
    startWeeksAgo,
    setStartWeeksAgo,
    defaultWeekOverlay,
    reportEvent = () => {},
}: {
    darkModeEnabled: boolean;
    articles?: Article[];
    startWeeksAgo: number;
    setStartWeeksAgo: (weeksAgo: number) => void;
    defaultWeekOverlay: number;
    reportEvent?: (event: string, data?: any) => void;
}) {
    const data = useMemo(() => {
        if (!articles) {
            return null;
        }
        return getActivityData(articles);
    }, [articles]);

    function changeWeekOffset(offset) {
        const newValue = -offset;
        if (newValue !== startWeeksAgo) {
            setStartWeeksAgo(newValue);
            reportEvent("changeStatsTimeWindow", { startWeeksAgo: newValue });
        }
    }

    if (data === null) {
        return <></>;
    }

    return (
        <div className="animate-fadein my-2 mr-2 max-w-[860px]">
            <ActivityCalendar
                data={data || []}
                startWeekOffset={-defaultWeekOverlay - 1}
                onChangeWeekOffset={changeWeekOffset}
                theme={getColorLevels(darkModeEnabled)}
                overlayColor={
                    darkModeEnabled ? "rgb(232, 230, 227, 0.1)" : "rgb(212, 212, 212, 0.3)"
                }
                labels={{
                    legend: { less: "Fewer articles read", more: "More" },
                }}
                blockRadius={3}
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

              level1: "rgb(237, 215, 91, 0.1)",
              level2: "rgb(237, 215, 91, 0.3)",
              level3: "rgb(237, 215, 91, 0.5)",
              level4: "rgb(237, 215, 91, 0.7)",
          }
        : {
              level0: "#fafaf9", // bg-stone-50
              level1: "rgb(237, 215, 91, 0.3)",
              level2: "rgb(237, 215, 91, 0.5)",
              level3: "rgb(237, 215, 91, 0.7)",
              level4: "rgb(237, 215, 91, 0.9)",
          };
}
