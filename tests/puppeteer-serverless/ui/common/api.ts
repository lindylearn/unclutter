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

    return itemDetails
        .map((detail) => detail.url)
        .filter((url) => url && new URL(url).pathname !== "/");
}

export async function triggerScreenshots(urls: string[], urlsPerWorker = 5) {
    const urlChunks = urls.reduce((all, one, i) => {
        const ch = Math.floor(i / urlsPerWorker);
        all[ch] = [].concat(all[ch] || [], one);
        return all;
    }, []);

    await Promise.all(
        urlChunks.map(async (urls) => {
            const response = await fetch(
                `https://puppeteer-serverless-jumq7esahq-uw.a.run.app/screenshot`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(urls),
                }
            );

            if (!response.ok) {
                console.log("failed with", urls);
            }
        })
    );
}
