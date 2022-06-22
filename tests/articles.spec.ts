import { chromium, expect, firefox, test as base } from "@playwright/test";
import path from "path";

const extensionPath = path.resolve("./distribution");

type WorkerContextFixture = {
    unclutterExtension: any;
};

const test = base.extend<{}, WorkerContextFixture>({
    // override default context to use launchPersistentContext(), which is required for browser extensions
    // it's not possible to set this via the config at the moment: https://github.com/microsoft/playwright/issues/11833
    context: [
        async ({ browserName }, use) => {
            const browserTypes = { chromium, firefox };
            const launchOptions = {
                headless: false, // extension are allowed only in head-full mode
                defaultViewport: { width: 1920, height: 1080 },
                args: [
                    `--disable-extensions-except=${extensionPath}`,
                    `--load-extension=${extensionPath}`,
                    `--disable-site-isolation-trials`, // to ignore some chromium errors
                ],
                dumpio: true,
            };
            const context = await browserTypes[
                browserName
            ].launchPersistentContext("", launchOptions);

            await use(context);

            await context.close();
        },
        { scope: "test" },
    ],

    unclutterExtension: async ({ context }, use) => {
        const extWorker = context.serviceWorkers()[0];

        use({
            unclutterActiveTab: async () =>
                await extWorker.evaluate(() => {
                    // @ts-ignore
                    chrome.tabs.query({ active: true }, (tabs) => {
                        // @ts-ignore
                        chrome.action.onClicked.dispatch(tabs[0]);
                    });
                }),
        });
    },
});

test.describe("Article uncluttering", () => {
    // const urls = await getHnTopLinks(20);
    const urls = [
        "https://amarioguy.github.io/m1windowsproject/",
        "https://www.saurabhnanda.in/2022/03/24/dhall-a-gateway-drug-to-haskell/",
        "https://underjord.io/id3-specification-and-speculation.html",
        "https://phys.org/news/2022-06-liquid-platinum-room-temperature-cool.html",
        "https://www.granturismoevents.com/story-the-epic-story-behind-the-ferrari-and-lamborghini-rivalry/",
        "https://jobs.lever.co/tesorio/dcc1de3f-e6ac-4c02-97d0-78138c8138a5",
        "https://siipo.la/blog/whats-the-best-lossless-image-format-comparing-png-webp-avif-and-jpeg-xl",
        "https://www.engadget.com/eu-reaches-deal-to-make-usb-c-a-common-charger-for-most-electronic-devices-104605067.html",
        "https://www.avweb.com/insider/faa-continues-to-stall-on-g100ul/",
        "https://keerthanapg.com/tech/embodiment-agi/",
        "https://www.electronicsweekly.com/news/business/793299-2022-03/",
        "http://dessinoprimaire.blogspot.com/2012/02/les-animaux-tels-quils-sont.html",
        "https://github.com/sensity-ai/dot",
        "https://usebottles.com/blog/an-open-letter/",
        "https://www.freightwaves.com/news/us-import-demand-drops-off-a-cliff",
    ];

    for (const url of urls) {
        test(url, async ({ page, unclutterExtension }) => {
            await page.goto(url, {
                waitUntil: "networkidle",
            });

            const beforeText = await page.evaluate(
                () => document.body.innerText
            );

            await unclutterExtension.unclutterActiveTab();
            await new Promise((r) => setTimeout(r, 1500));

            // check if page has minmum character count
            const afterText = await page.evaluate(
                () => document.body.innerText
            );
            expect(afterText.length).toBeGreaterThan(beforeText.length * 0.5);

            // const body = await page.$("body");
            // const bodyPos = await body.boundingBox();
            // await expect(page).toHaveScreenshot({
            //     clip: {
            //         x: bodyPos.x - 10,
            //         y: bodyPos.y - 10,
            //         width: bodyPos.width + 15 + 10,
            //         height: 1500,
            //     },
            // });
        });
    }
});
