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
            timeout: 10000,
        });
    } catch {}

    await new Promise((r) => setTimeout(r, 2000));

    const body = await page.$("body");
    const bodyPos = await body!.boundingBox();
    await page.screenshot({
        path: `${localScreenshotsPath}/${encodeURIComponent(url)}.png`,
        clip: {
            x: bodyPos!.x - 10,
            y: bodyPos!.y - 10,
            width: bodyPos!.width + 20 + 10,
            height: 1000,
        },
    });

    await page.close();
}
