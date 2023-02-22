import { format as formatRelativeTime } from "timeago.js";

export function getRelativeTime(timestamp: number, floorToday = true, removeAgo = true): string {
    const date = new Date(timestamp);
    if (floorToday && date.toDateString() === new Date().toDateString()) {
        return "today";
    }

    let string = formatRelativeTime(date);
    if (removeAgo) {
        string = string.replace(" ago", "");
    }
    return string;
}

export function getWeekNumber(date: Date): number {
    var onejan = new Date(date.getFullYear(), 0, 1);
    var millisecsInDay = 86400000;
    return Math.ceil(
        // @ts-ignore
        ((date - onejan) / millisecsInDay + onejan.getDay() + 1) / 7
    );
}

export function getWeekStart(start: Date = new Date()): Date {
    const diff = start.getDate() - start.getDay() + (start.getDay() === 0 ? -7 : 0);
    start.setDate(diff);
    start.setHours(0);
    start.setMinutes(0);
    start.setSeconds(0);
    start.setMilliseconds(0);
    return start;
}

export function subtractWeeks(date: Date, weeks: number): Date {
    return new Date(date.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
}
