import puppeteer from "puppeteer";
import { localScreenshotsPath } from "./results.js";

export async function captureUrl(
    browser: puppeteer.Browser,
    extWorker: puppeteer.WebWorker,
    url: string
) {
    console.log(`Capturing ${url}...`);

    const page = await browser.newPage();
    await page.goto(url, {
        waitUntil: "domcontentloaded",
    });

    console.log("page loaded");

    // await extWorker.evaluate(() => {
    //     // @ts-ignore
    //     chrome.tabs.query({ active: true }, (tabs) => {
    //         // @ts-ignore
    //         chrome.action.onClicked.dispatch(tabs[0]);
    //     });
    // });

    console.log("before wait");
    await new Promise((r) => setTimeout(r, 1500));

    console.log("uncluttered");

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
