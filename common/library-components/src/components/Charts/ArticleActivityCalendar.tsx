import React, { useMemo } from "react";
import {
    ActivityCalendar,
    CalendarData,
    Level,
    Theme,
} from "./ActivityCalendar";
import { eachDayOfInterval, subYears } from "date-fns";

import { Article } from "../../store";
import { getWeekStart, subtractWeeks } from "../../common";

export function ArticleActivityCalendar({
    darkModeEnabled,
    articles,
    onSelectDate,
    start,
    setStart,
}: {
    darkModeEnabled: boolean;
    articles?: Article[];
    onSelectDate: (date: Date) => void;
    start: Date;
    setStart: (date: Date) => void;
}) {
    const data = useMemo(() => {
        if (!articles) {
            return null;
        }
        return getActivityData(articles);
    }, [articles]);

    function onChangeWeekOffset(offset: number) {
        const end = getWeekStart(new Date());
        const start = subtractWeeks(end, -offset);
        setStart(start);
    }

    if (data === null) {
        return <></>;
    }

    return (
        <div className="animate-fadein my-2 mr-2 max-w-[860px]">
            <ActivityCalendar
                data={data || []}
                startWeekOffset={-2}
                onChangeWeekOffset={onChangeWeekOffset}
                theme={getColorLevels(darkModeEnabled)}
                overlayColor={
                    darkModeEnabled ? "rgba(0,0,0,0.5)" : "rgb(28, 25, 23, 0.1)"
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
            const date = new Date(a.time_added * 1000)
                .toISOString()
                .split("T")[0];

            dateCounts[date] += 1;
        });

    return Object.entries(dateCounts).map(([date, count]) => ({
        date,
        count,
        level: getActivityLevel(count),
    }));
}

export function getActivityColor(
    activityLevel: Level,
    darkModeEnabled: boolean
) {
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
              level3: "rgb(237, 215, 91, 0.6)",
              level4: "rgb(237, 215, 91, 1.0)",
          }
        : {
              level0: "#fafaf9", // bg-stone-50
              level1: "rgb(237, 215, 91, 0.3)",
              level2: "rgb(237, 215, 91, 0.5)",
              level3: "rgb(237, 215, 91, 0.7)",
              level4: "rgb(237, 215, 91, 1.0)",
          };
}
