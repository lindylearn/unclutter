import { promises as fs } from "fs";
import fetch from "node-fetch";

const excludedDomains = ["twitter.com"];

async function getHnTopLinks(limit = 30) {
    const topResponse = await fetch(
        "https://hacker-news.firebaseio.com/v0/topstories.json"
    );
    const idList = await topResponse.json();

    const itemDetails = await Promise.all(
        idList.slice(0, limit).map(async (id) => {
            try {
                const detailResponse = await fetch(
                    `https://hacker-news.firebaseio.com/v0/item/${id}.json`
                );
                return await detailResponse.json();
            } catch (err) {
                console.error(err);
                return null;
            }
        })
    );

    return itemDetails
        .map((detail) => detail?.url)
        .filter(
            (url) =>
                url &&
                new URL(url).pathname !== "/" &&
                !excludedDomains.includes(new URL(url).host)
        );
}

async function main() {
    const urls = await getHnTopLinks(1000);
    await fs.writeFile("./urls/hn.json", JSON.stringify(urls));
}
main();
