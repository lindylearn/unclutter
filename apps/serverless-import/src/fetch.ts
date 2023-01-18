import axios from "axios";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export async function fetchDocument(url: string): Promise<Document | undefined> {
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
    console.log(`Fetched remote document in ${Math.round(performance.now() - start)}ms`);

    return document;
}

export async function fetchArticleParagraphs(url: string): Promise<string[] | undefined> {
    let paragraphs: string[] = [];

    // try readability
    const reader = new Readability(document);
    const article = reader.parse();
    const readabilityText = article?.textContent;

    // TODO this doesn't seem to work
    const innerText = naiveInnerText(document.body);
    console.log(readabilityText?.length, innerText.length);

    if (readabilityText && readabilityText.length >= 0.5 * innerText.length) {
        // assume readability is working if includes min. 50% of the text

        // split paragraphs for better sentence combine, but it's not that important
        // filtering by single \n breaks http://paulgraham.com/own.html
        paragraphs = article.textContent.split("\n\n");
    } else {
        // otherwise use all body text
        // one paragraph because non-visible newlines might occur within sentences
        // e.g. needed for http://paulgraham.com/read.html
        paragraphs = [innerText];
    }

    // clean
    paragraphs = paragraphs
        .map((p) => p.replace(/\n/g, " ").replace(/\s+/g, " ").trim())
        .filter((p) => p.length >= 100);

    console.log(
        `Fetched ${paragraphs.length} article paragraphs in ${Math.round(
            performance.now() - start
        )}ms`
    );

    return paragraphs;
}

function naiveInnerText(node: Node) {
    const Node = node; // We need Node(DOM's Node) for the constants, but Node doesn't exist in the nodejs global space, and any Node instance references the constants through the prototype chain
    return [...node.childNodes]
        .map((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent;
            }
            if (node.childNodes) {
                return naiveInnerText(node);
            }
            return "";
        })
        .join("\n");
}
