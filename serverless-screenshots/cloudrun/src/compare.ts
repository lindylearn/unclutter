import fs from "fs";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import {
    diffScreenshotsPath,
    localScreenshotsPath,
    previousScreenshotsPath,
} from "./results.js";
import { getUrlFilename } from "./screenshot.js";

export async function compareUrlImages(url: string) {
    const fileName = getUrlFilename(url);

    const img1 = PNG.sync.read(
        fs.readFileSync(`${localScreenshotsPath}/${fileName}`)
    );
    const img2 = PNG.sync.read(
        fs.readFileSync(`${previousScreenshotsPath}/${fileName}`)
    );
    const { width, height } = img1;
    const diff = new PNG({ width, height });

    const numDiffPixels = pixelmatch(
        img1.data,
        img2.data,
        diff.data,
        width,
        height,
        {
            threshold: 0.1,
        }
    );

    if (numDiffPixels >= 100) {
        fs.writeFileSync(
            `${diffScreenshotsPath}/${fileName}`,
            PNG.sync.write(diff)
        );
        return true;
    }

    return false;
}
