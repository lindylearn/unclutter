// TODO: re-add types

import type { GraphData } from "force-graph";
import type { Article } from "@unclutter/library-components/dist/store/_schema";
import type { LibraryInfo } from "./schema";

// const lindyApiUrl = "http://localhost:8000";
const lindyApiUrl = "https://api2.lindylearn.io";

export async function checkArticleInLibrary(url: string, user_id: string): Promise<LibraryInfo> {
    const response = await fetch(
        `${lindyApiUrl}/library/check_article?${new URLSearchParams({
            url,
            user_id,
        })}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        }
    );
    if (!response.ok) {
        return null;
    }

    const json = await response.json();
    return json;
}

export async function addArticlesToLibrary(
    urls: string[],
    user_id: string
): Promise<LibraryInfo[]> {
    const response = await fetch(
        `${lindyApiUrl}/library/import_articles?${new URLSearchParams({
            user_id,
        })}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(
                urls.map((url) => ({
                    url,
                }))
            ),
        }
    );
    if (!response.ok) {
        return Array(urls.length).fill(null);
    }

    const json = await response.json();
    return json.added;
}

export async function updateLibraryArticle(
    url: string,
    user_id: string,
    diff: Partial<Article>
): Promise<void> {
    const response = await fetch(
        `${lindyApiUrl}/library/update_article?${new URLSearchParams({
            user_id,
            url,
        })}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(diff),
            keepalive: true, // important to finish request after page close
        }
    );
    if (!response.ok) {
        console.error(`Updating library article failed: ${response}`);
        return null;
    }
}

export async function getRelatedArticles(url: string, user_id: string) {
    const response = await fetch(
        `${lindyApiUrl}/library/related_articles?${new URLSearchParams({
            user_id,
            url,
        })}`,
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    );
    if (!response.ok) {
        return [];
    }

    const json = await response.json();
    return json?.slice(0, 3);
}

export async function getLinkedArticles(
    urls: string[],
    user_id?: string
): Promise<(Article | null)[]> {
    const response = await fetch(
        `${lindyApiUrl}/library/linked_article_info?${new URLSearchParams({
            user_id,
        })}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ urls }),
        }
    );
    if (!response.ok) {
        return [];
    }

    const json = await response.json();
    return json?.articles || [];
}

export async function getArticleGraph(url: string, user_id: string): Promise<GraphData | null> {
    const response = await fetch(
        `${lindyApiUrl}/library_graph/fetch?${new URLSearchParams({
            url,
            user_id,
        })}`
    );
    if (!response.ok) {
        return null;
    }

    return await response.json();
}

export interface RelatedHighlight {
    id: string;
    article_id: string;
    text: string;
    score: number;

    score2?: number;
    anchor?: string;
    excerpt: string;
}

export async function fetchRelatedAnnotations(
    user_id: string,
    article_id: string,
    highlights: string[],
    score_threshold: number = 0.5,
    save_highlights: boolean = false
): Promise<RelatedHighlight[][]> {
    const response = await fetch(`${lindyApiUrl}/related/fetch`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            user_id,
            for_article_id: article_id,
            highlights,
            score_threshold,
            save_highlights,
        }),
    });
    const json = await response.json();
    return json?.related;
}

export async function indexAnnotationVectors(
    user_id: string,
    article_id: string,
    highlights: string[],
    highlight_ids: string[] = undefined,
    delete_previous: boolean = false
) {
    await fetch(`${lindyApiUrl}/related/insert`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            user_id,
            article_id,
            highlights,
            delete_previous,
        }),
    });
}

export async function deleteAnnotationVectors(
    user_id: string,
    article_id: string = undefined,
    highlight_id: string = undefined
) {
    await fetch(`${lindyApiUrl}/related/delete`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            user_id,
            article_id,
            highlight_id,
        }),
    });
}
