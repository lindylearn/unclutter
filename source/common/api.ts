// for some reason, using types in this file leads to bundling errors

const lindyApiUrl = "http://localhost:8000";
// const lindyApiUrl = "https://api2.lindylearn.io";

export async function checkArticleInLibrary(url, user_id) {
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

export async function addArticleToLibrary(url, user_id) {
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
