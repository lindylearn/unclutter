import axios from "axios";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export async function fetchArticleParagraphs(url: string): Promise<string[] | undefined> {
    const start = performance.now();

    const response = await axios.get(url, {
        headers: {
            // https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers
            "User-Agent":
                "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/109.0.0.0 Safari/537.36",
        },
        timeout: 15 * 1000,
        responseType: "text",
        maxContentLength: 1024 * 1024 * 10, // 10MB
    });
    const html = response.data;
    if (!html) {
        return;
    }

    const document = new JSDOM(html, { url })?.window?.document;
    if (!document) {
        return;
    }

    const reader = new Readability(document);
    const article = reader.parse();

    // split paragraphs
    let paragraphs = article?.textContent?.split("\n\n") || [];

    console.log(
        `Fetched ${paragraphs.length} article paragraphs in ${Math.round(
            performance.now() - start
        )}ms`
    );

    return paragraphs;
}
