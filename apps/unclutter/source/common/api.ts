// TODO: re-add types

import type { GraphData } from "force-graph";
import { Article } from "@unclutter/library-components/dist/store/_schema";
import { LibraryInfo } from "./schema";
import { BookmarkedPage } from "../background/bookmarks";

// const lindyApiUrl = "http://localhost:8000";
const lindyApiUrl = "https://api2.lindylearn.io";

export async function checkArticleInLibrary(
    url: string,
    user_id: string
): Promise<LibraryInfo> {
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

export async function addArticleToLibrary(
    url: string,
    user_id: string
): Promise<LibraryInfo> {
    const response = await fetch(
        `${lindyApiUrl}/library/import_articles?${new URLSearchParams({
            user_id,
        })}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify([{ url }]),
        }
    );
    if (!response.ok) {
        return null;
    }

    const json = await response.json();
    return {
        ...json.added?.[0],
        new_links: json.new_links || [],
    };
}

export async function clusterLibraryArticles(
    articles: BookmarkedPage[],
    user_id: string
): Promise<void> {
    // normalize fields to reduce message size
    const importData = {
        urls: articles.map(({ url }) => url),
        time_added: articles.map(({ time_added }) => time_added),
        favorite: articles.map(({ favorite }) => favorite),
    };

    await fetch(
        `${lindyApiUrl}/library/cluster_articles?${new URLSearchParams({
            user_id,
        })}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(importData),
        }
    );
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

export async function createScreenshots(urls: string[]): Promise<string[]> {
    const response = await fetch(`${lindyApiUrl}/library/create_screenshots`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ urls }),
    });
    return await response.json(); // returns new urls
}

export async function getArticleGraph(
    url: string,
    user_id: string
): Promise<GraphData | null> {
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
