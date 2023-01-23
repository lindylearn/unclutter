import type { Article, FeedSubscription } from "../store";

export function groupBy(xs, key) {
    return xs.reduce(function (rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
}

export function getDomain(url: string): string | undefined {
    try {
        return new URL(url).hostname.replace("www.", "");
    } catch {
        return;
    }
}

export function formatDate(date: Date): string {
    return date?.toDateString().split(" ").slice(1, 3).join(" ");
}

export function cleanTitle(title: string): string {
    title = title.trim().split("\n")[0];

    while (title.includes("  ")) {
        title = title.replace(/  /g, " ");
    }

    if (title.endsWith(":")) {
        title = title.slice(0, title.length - 1);
    }

    title = title.split("|")[0].split(" - ")[0].split("–")[0].trim();

    return title;
}

export function formatPostFrequency(
    frequency: FeedSubscription["post_frequency"]
): string | undefined {
    if (!frequency) {
        return undefined;
    }
    return `${frequency.count} article${frequency.count != 1 ? "s" : ""} per ${frequency.period}`;
}

export function splitSentences(text: string): string[] {
    let sentences: string[] | null = null;
    try {
        // regex from https://stackoverflow.com/questions/11761563/javascript-regexp-for-splitting-text-into-sentences-and-keeping-the-delimiter
        // be careful, webkit doesn't support lookbehind
        sentences = text.match(/\(?[^\.\?\!]+[\.\?\!]\)?\s?/g);
    } catch {}
    if (!sentences) {
        return [text];
    }

    return sentences; //.map((s) => s.trim());
}

export function constructLocalArticle(
    articleUrl: string,
    articleId: string,
    articleTitle: string
): Article {
    return {
        id: articleId,
        url: articleUrl,
        title: cleanTitle(articleTitle),
        word_count: 0, // TODO how to get this in frontend?
        publication_date: null, // TODO how to get this in frontend?
        time_added: Math.round(new Date().getTime() / 1000),
        reading_progress: 0.0,
        topic_id: null,
        is_favorite: false,
    };
}
