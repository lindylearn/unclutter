import { format as formatRelativeTime } from "timeago.js";

export function getRelativeTime(timestamp: number | string): string {
    // Safari has issues with some formats, but this seems to work?
    // See https://stackoverflow.com/questions/6427204/date-parsing-in-javascript-is-different-between-safari-and-chrome

    const date = new Date(timestamp);
    return formatRelativeTime(date, "en_US", { minInterval: 60 });
}
