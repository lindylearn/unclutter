import { captureUrl, startBrowser } from "./browser.js";
import { getHnTopLinks } from "./urls.js";

async function main() {
    const urls = await getHnTopLinks(10);

    const [browser, extWorker] = await startBrowser();

    for (const url of urls) {
        await captureUrl(browser, extWorker, url);
    }

    await browser.close();
}

main();
