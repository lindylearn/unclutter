import puppeteer from "puppeteer";
import { localScreenshotsPath } from "./results.js";

export async function captureUrl(
    browser: puppeteer.Browser,
    extWorker: puppeteer.WebWorker,
    url: string
) {
    console.log(`Capturing ${url} ...`);

    const page = await browser.newPage();
    page.on("console", (message) => {
        console.log(`Console: ${message.text()}`);
    });
    page.on("pageerror", ({ message }) => console.log(`Error: ${message}`));

    try {
        await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 5000,
        });
    } catch {}

    await new Promise((r) => setTimeout(r, 2500));

    const body = await page.$("body");
    if (!body) {
        console.error(`Error: no body tag on ${url}`);
        return;
    }
    const bodyPos = await body.boundingBox();
    await page.screenshot({
        path: `${localScreenshotsPath}/${getUrlFilename(url)}`,
        clip: {
            x: bodyPos!.x - 10,
            y: bodyPos!.y - 10,
            width: bodyPos!.width + 20 + 10,
            height: 1100,
        },
    });

    await page.close();
}

export function getUrlFilename(url: string) {
    const urlObj = new URL(url);
    const urlString = `${urlObj.origin}${urlObj.pathname}`.slice(0, 150);

    return `${encodeURIComponent(urlString)}.png`;
}
