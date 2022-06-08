import { startBrowser } from "./browser.js";
import { captureUrl } from "./screenshot.js";

async function main() {
    const [browser, extWorker] = await startBrowser();
    await captureUrl(
        browser,
        extWorker,
        "https://phys.org/news/2022-06-liquid-platinum-room-temperature-cool.html"
    );

    browser.close();
}

main();
