import fetch from "node-fetch";

export async function getHnTopLinks(limit = 30): Promise<string[]> {
    const topResponse = await fetch(
        "https://hacker-news.firebaseio.com/v0/topstories.json"
    );
    const idList = (await topResponse.json()) as number[];

    const itemDetails = await Promise.all(
        idList.slice(0, limit).map(async (id) => {
            const detailResponse = await fetch(
                `https://hacker-news.firebaseio.com/v0/item/${id}.json`
            );
            return (await detailResponse.json()) as any;
        })
    );

    return itemDetails.map((detail) => detail.url).filter((url) => url);
}
