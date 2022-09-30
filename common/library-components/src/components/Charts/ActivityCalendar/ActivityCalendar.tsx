import React, { FunctionComponent, CSSProperties, ReactNode } from "react";
import tinycolor, { ColorInput } from "tinycolor2";
import format from "date-fns/format";
import getYear from "date-fns/getYear";
import parseISO from "date-fns/parseISO";
import type { Day as WeekDay } from "date-fns";

import {
    Day,
    EventHandlerMap,
    Labels,
    ReactEvent,
    SVGRectEventHandler,
    Theme,
} from "./types";
import {
    generateEmptyData,
    getClassName,
    getMonthLabels,
    getTheme,
    groupByWeeks,
    MIN_DISTANCE_MONTH_LABELS,
    NAMESPACE,
    DEFAULT_WEEKDAY_LABELS,
    DEFAULT_LABELS,
} from "./util";

export type CalendarData = Array<Day>;

export interface Props {
    /**
     * List of calendar entries. Every `Day` object requires an ISO 8601 `date`
     * property in the format `yyyy-MM-dd`, a `count` property with the amount
     * of tracked data and finally a `level` property in the range `0 - 4` to
     * specify activity intensity.
     *
     * Example object:
     *
     * ```json
     * {
     *   date: "2021-02-20",
     *   count: 16,
     *   level: 3
     * }
     * ```
     */
    data: CalendarData;
    /**
     * Margin between blocks in pixels.
     */
    blockMargin?: number;
    /**
     * Border radius of blocks in pixels.
     */
    blockRadius?: number;
    /**
     * Block size in pixels.
     */
    blockSize?: number;
    /**
     * Pass `<ReactTooltip html />` as child to show tooltips.
     */
    children?: ReactNode;
    /**
     * Base color to compute graph intensity hues (the darkest color). Any valid CSS color is accepted
     */
    color?: ColorInput;
    /**
     * A date-fns/format compatible date string used in tooltips.
     */
    dateFormat?: string;
    /**
     * Event handlers to register for the SVG `<rect>` elements that are used to render the calendar days. Handler signature: `event => data => void`
     */
    eventHandlers?: EventHandlerMap;
    /**
     * Font size for text in pixels.
     */
    fontSize?: number;
    /**
     * Toggle to hide color legend below calendar.
     */
    hideColorLegend?: boolean;
    /**
     * Toggle to hide month labels above calendar.
     */
    hideMonthLabels?: boolean;
    /**
     * Toggle to hide total count below calendar.
     */
    hideTotalCount?: boolean;
    /**
     * Localization strings for all calendar labels.
     *
     * - `totalCount` supports the placeholders `{{count}}` and `{{year}}`.
     * - `tooltip` supports the placeholders `{{count}}` and `{{date}}`.
     */
    labels?: Labels;
    /**
     * Toggle for loading state. `data` property will be ignored if set.
     */
    loading?: boolean;
    /**
     * Toggle to show weekday labels left to the calendar.
     */
    showWeekdayLabels?: boolean;
    /**
     * Style object to pass to component container.
     */
    style?: CSSProperties;
    /**
     * An object specifying all theme colors explicitly`.
     */
    theme?: Theme;
    /**
     * Index of day to be used as start of week. 0 represents Sunday.
     */
    weekStart?: WeekDay;
}

export function ActivityCalendar({
    data,
    blockMargin = 4,
    blockRadius = 2,
    blockSize = 12,
    children,
    color = undefined,
    dateFormat = "MMM do, yyyy",
    eventHandlers = {},
    fontSize = 14,
    hideColorLegend = false,
    hideMonthLabels = false,
    hideTotalCount = false,
    labels: labelsProp,
    loading = false,
    showWeekdayLabels = false,
    style = {},
    theme: themeProp,
    weekStart = 0, // Sunday
}: Props) {
    if (loading) {
        data = generateEmptyData();
    }

    if (data.length === 0) {
        return null;
    }

    const weeks = groupByWeeks(data, weekStart);
    const totalCount = data.reduce((sum, day) => sum + day.count, 0);
    const year = getYear(parseISO(data[0]?.date));

    const theme = getTheme(themeProp, color);
    const labels = Object.assign({}, DEFAULT_LABELS, labelsProp);
    const textHeight = hideMonthLabels ? 0 : fontSize + 2 * blockMargin;

    function getDimensions() {
        return {
            width: weeks.length * (blockSize + blockMargin) - blockMargin,
            height: textHeight + (blockSize + blockMargin) * 7 - blockMargin,
        };
    }

    function getTooltipMessage(contribution: Day) {
        const date = format(parseISO(contribution.date), dateFormat);
        const tooltip = labels.tooltip ?? DEFAULT_LABELS.tooltip;

        return tooltip
            .replaceAll("{{count}}", String(contribution.count))
            .replaceAll("{{date}}", date);
    }

    function getEventHandlers(data: Day): SVGRectEventHandler {
        return (
            Object.keys(eventHandlers) as Array<keyof SVGRectEventHandler>
        ).reduce<SVGRectEventHandler>(
            (handlers, key) => ({
                ...handlers,
                [key]: (event: ReactEvent<SVGRectElement>) =>
                    eventHandlers[key]?.(event)(data),
            }),
            {}
        );
    }

    function renderLabels() {
        const style = {
            fontSize,
        };

        if (!showWeekdayLabels && hideMonthLabels) {
            return null;
        }

        return (
            <>
                {showWeekdayLabels && (
                    <g className={getClassName("legend-weekday")} style={style}>
                        {weeks[0].map((day, index) => {
                            if (index % 2 === 0) {
                                return null;
                            }

                            const dayIndex = (index + weekStart) % 7;

                            return (
                                <text
                                    x={-2 * blockMargin}
                                    y={
                                        textHeight +
                                        (fontSize / 2 + blockMargin) +
                                        (blockSize + blockMargin) * index
                                    }
                                    textAnchor="end"
                                    key={index}
                                >
                                    {labels.weekdays
                                        ? labels.weekdays[dayIndex]
                                        : DEFAULT_WEEKDAY_LABELS[dayIndex]}
                                </text>
                            );
                        })}
                    </g>
                )}
                {!hideMonthLabels && (
                    <g className={getClassName("legend-month")} style={style}>
                        {getMonthLabels(weeks, labels.months).map(
                            ({ text, x }, index, labels) => {
                                // Skip the first month label if there's not enough space to the next one
                                if (
                                    index === 0 &&
                                    labels[1] &&
                                    labels[1].x - x <= MIN_DISTANCE_MONTH_LABELS
                                ) {
                                    return null;
                                }

                                return (
                                    <text
                                        x={(blockSize + blockMargin) * x}
                                        alignmentBaseline="hanging"
                                        key={x}
                                    >
                                        {text}
                                    </text>
                                );
                            }
                        )}
                    </g>
                )}
            </>
        );
    }

    function renderBlocks() {
        return weeks
            .map((week, weekIndex) =>
                week.map((day, dayIndex) => {
                    if (!day) {
                        return null;
                    }

                    const style = loading
                        ? {
                              animation: `calendarLoadingAnimation 1.5s ease-in-out infinite`,
                              animationDelay: `${
                                  weekIndex * 20 + dayIndex * 20
                              }ms`,
                          }
                        : undefined;

                    return (
                        <rect
                            {...getEventHandlers(day)}
                            x={0}
                            y={
                                textHeight +
                                (blockSize + blockMargin) * dayIndex
                            }
                            width={blockSize}
                            height={blockSize}
                            fill={theme[`level${day.level}` as keyof Theme]}
                            rx={blockRadius}
                            ry={blockRadius}
                            data-date={day.date}
                            data-tip={
                                children ? getTooltipMessage(day) : undefined
                            }
                            key={day.date}
                            style={{
                                ...style,
                                shapeRendering: "geometricPrecision",
                            }}
                        />
                    );
                })
            )
            .map((week, x) => (
                <g
                    key={x}
                    transform={`translate(${(blockSize + blockMargin) * x}, 0)`}
                >
                    {week}
                </g>
            ));
    }

    function renderFooter() {
        if (hideTotalCount && hideColorLegend) {
            return null;
        }

        return (
            <footer
                className="flex"
                style={{ marginTop: 2 * blockMargin, fontSize }}
            >
                {/* Placeholder */}
                {loading && <div>&nbsp;</div>}

                {!loading && !hideTotalCount && (
                    <div className={getClassName("count")}>
                        {labels.totalCount
                            ? labels.totalCount
                                  .replace("{{count}}", String(totalCount))
                                  .replace("{{year}}", String(year))
                            : `${totalCount} contributions in ${year}`}
                    </div>
                )}

                {!loading && !hideColorLegend && (
                    <div className="ml-auto flex items-center gap-[0.2em]">
                        <span style={{ marginRight: "0.4em" }}>
                            {labels?.legend?.less ?? "Less"}
                        </span>
                        {Array(5)
                            .fill(undefined)
                            .map((_, index) => (
                                <svg
                                    width={blockSize}
                                    height={blockSize}
                                    key={index}
                                >
                                    <rect
                                        width={blockSize}
                                        height={blockSize}
                                        fill={
                                            theme[
                                                `level${index}` as keyof Theme
                                            ]
                                        }
                                        rx={blockRadius}
                                        ry={blockRadius}
                                    />
                                </svg>
                            ))}
                        <span style={{ marginLeft: "0.4em" }}>
                            {labels?.legend?.more ?? "More"}
                        </span>
                    </div>
                )}
            </footer>
        );
    }

    const { width, height } = getDimensions();
    const additionalStyles = {
        maxWidth: width,
        // Required for correct colors in CSS loading animation
        [`--${NAMESPACE}-loading`]: theme.level0,
        [`--${NAMESPACE}-loading-active`]: tinycolor(theme.level0)
            .darken(8)
            .toString(),
    };

    return (
        <article
            className={NAMESPACE}
            style={{ ...style, ...additionalStyles }}
        >
            <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="calendar block h-auto max-w-full overflow-visible"
            >
                {!loading && renderLabels()}
                {renderBlocks()}
            </svg>
            {renderFooter()}
            {children}
        </article>
    );
}

export const Skeleton: FunctionComponent<Omit<Props, "data">> = (props) => (
    <ActivityCalendar data={[]} {...props} />
);

export default ActivityCalendar;
