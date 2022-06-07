import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const extensionPath = path.resolve("./distribution");
const screenshotsPath = path.resolve("./test-artifacts/screenshots");
const videosPath = path.resolve("./test-artifacts/videos");

export async function startBrowser(): Promise<
    [puppeteer.Browser, puppeteer.WebWorker]
> {
    const browser = await puppeteer.launch({
        headless: false, // extension are allowed only in head-full mode
        defaultViewport: { width: 1440, height: 1080 },
        args: [
            `--disable-extensions-except=${extensionPath}`,
            `--load-extension=${extensionPath}`,
            `--disable-site-isolation-trials`, // to ignore some chromium errors
        ],
        dumpio: true,
    });

    const extBackgroundTarget = await browser.waitForTarget(
        (t) => t.type() === "service_worker"
    );
    const extWorker = await extBackgroundTarget.worker();

    if (!fs.existsSync(screenshotsPath)) {
        fs.mkdirSync(screenshotsPath, { recursive: true });
    }
    if (!fs.existsSync(videosPath)) {
        fs.mkdirSync(videosPath, { recursive: true });
    }

    return [browser, extWorker];
}

export async function captureUrl(
    browser: puppeteer.Browser,
    extWorker: puppeteer.WebWorker,
    url: string
) {
    console.log(`Capturing ${url}...`);

    const page = await browser.newPage();
    await page.goto(url, {
        waitUntil: "networkidle2",
    });

    await extWorker.evaluate(() => {
        // @ts-ignore
        chrome.tabs.query({ active: true }, (tabs) => {
            // @ts-ignore
            chrome.action.onClicked.dispatch(tabs[0]);
        });
    });

    await new Promise((r) => setTimeout(r, 1500));

    // await page.screenshot({
    //     path: `${screenshotsPath}/${encodeURIComponent(url)}.png`,
    // });

    const element = await page.$("body");
    const elementPos = await element.boundingBox();
    await element.screenshot({
        path: `${screenshotsPath}/${encodeURIComponent(url)}.png`,
        clip: {
            x: elementPos.x - 10,
            y: elementPos.y - 10,
            width: elementPos.width + 20 + 10,
            height: 1000,
        },
    });

    await page.close();
}
