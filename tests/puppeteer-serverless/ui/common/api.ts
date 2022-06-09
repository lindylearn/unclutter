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
