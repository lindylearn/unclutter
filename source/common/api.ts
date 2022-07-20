import { LibraryArticle } from "./schema";

// const lindyApiUrl = "http://localhost:8000";
const lindyApiUrl = "https://api2.lindylearn.io";

const user_id = "5cdac850-1798-4b65-afe2-69de3c28dbc5";

export async function checkArticleInLibrary(
    url: string
): Promise<LibraryArticle> {
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
    if (response.ok) {
        return null;
    }

    const json = await response.json();
    return json.article;
}

export async function addArticleToLibrary(
    url: string
): Promise<LibraryArticle> {
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
    return json.added[0];
}
