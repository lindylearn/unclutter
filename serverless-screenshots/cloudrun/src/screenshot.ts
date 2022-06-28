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

    await new Promise((r) => setTimeout(r, 3000));

    // clean up page for screenshot
    await page.evaluate(() => {
        console.log("patching!");
        document.documentElement.style.setProperty(
            "background",
            "transparent",
            "important"
        );
        document.documentElement.style.setProperty(
            "--lindy-active-font-size",
            "20px"
        );
        document.documentElement.style.setProperty(
            "--lindy-pagewidth",
            "750px"
        );
        document.body.style.removeProperty("box-shadow");

        document.getElementById("lindy-page-settings-pageadjacent")?.remove();

        // trigger rerender
        document.body.getBoundingClientRect();
    });
    await new Promise((r) => setTimeout(r, 1000));

    const body = await page.$("body");
    if (!body) {
        console.error(`Error: no body tag on ${url}`);
        return;
    }
    const bodyPos = await body.boundingBox();
    await body.screenshot({
        path: `${localScreenshotsPath}/${getUrlFilename(url)}`,
        type: "webp",
        clip: {
            x: bodyPos!.x,
            y: bodyPos!.y,
            width: bodyPos!.width,
            height: 900,
        },
        omitBackground: true,
    });
    // await page.screenshot({
    //     path: `${localScreenshotsPath}/${getUrlFilename(url)}`,
    //     clip: {
    //         x: bodyPos!.x,
    //         y: bodyPos!.y,
    //         width: bodyPos!.width - 20,
    //         height: 900,
    //     },
    //     omitBackground: true,
    // });

    await page.close();
}

export function getUrlFilename(url: string) {
    const urlObj = new URL(url);
    const urlString = `${urlObj.origin}${urlObj.pathname}`.slice(0, 150);

    return `${encodeURIComponent(urlString)}.webp`;
}
