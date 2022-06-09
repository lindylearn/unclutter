import { startBrowser } from "./browser.js";
import { compareUrlImages } from "./compare.js";
import { downloadPreviousUrlScreenshot } from "./results.js";
import { captureUrl } from "./screenshot.js";

async function main() {
    const [browser, extWorker] = await startBrowser();
    const url = "https://fev.al/posts/leet-code/";

    await captureUrl(browser, extWorker, url);

    const hasPrevScreenshot = await downloadPreviousUrlScreenshot(url);
    if (hasPrevScreenshot) {
        await compareUrlImages(url);
    }

    browser.close();
}

main();
