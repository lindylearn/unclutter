import { format as formatRelativeTime } from "timeago.js";

export function getRelativeTime(timestamp: number): string {
    // Safari has issues with some formats, but this seems to work?
    // See https://stackoverflow.com/questions/6427204/date-parsing-in-javascript-is-different-between-safari-and-chrome

    const date = new Date(timestamp);
    return formatRelativeTime(date);
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
    const diff =
        start.getDate() - start.getDay() + (start.getDay() === 0 ? -6 : 1);
    start.setDate(diff);
    return start;
}

export function subtractWeeks(date: Date, weeks: number): Date {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() - weeks * 7);
    return newDate;
}
