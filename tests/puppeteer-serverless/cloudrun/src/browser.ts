import path from "path";
import puppeteer from "puppeteer";

const extensionPath = path.resolve("./extension");
// const screenshotsPath = path.resolve("./test-artifacts/screenshots");
// const videosPath = path.resolve("./test-artifacts/videos");

export async function startBrowser(): Promise<
    [puppeteer.Browser, puppeteer.WebWorker]
> {
    const browser = await puppeteer.launch({
        headless: false, // extension are allowed only in head-full mode
        defaultViewport: { width: 1920, height: 1080 },
        args: [
            // performance tweaks, see https://github.com/puppeteer/puppeteer/issues/3120
            "--no-xshm",
            "--disable-gpu",
            "--disable-dev-shm-usage",
            "--disable-setuid-sandbox",
            "--no-first-run",
            "--no-sandbox",
            "--no-zygote",
            "--single-process", // <- this one doesn't works in Windows

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

    return [browser, extWorker!];
}
