export function groupBy(xs, key) {
    return xs.reduce(function (rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
}

export function getDomain(url: string): string {
    return new URL(url).hostname.replace("www.", "");
}

export function formatDate(date: Date): string {
    return date?.toDateString().split(" ").slice(1, 3).join(" ");
}
