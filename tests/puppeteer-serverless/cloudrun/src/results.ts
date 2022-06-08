import { Storage } from "@google-cloud/storage";
import { existsSync, promises as fs, rmSync } from "fs";

const bucketName = "unclutter-screenshots-serverless";
export const localScreenshotsPath = "./screenshots";

const storage = new Storage(); // use default service account

export async function prepare() {
    if (existsSync(localScreenshotsPath)) {
        rmSync(localScreenshotsPath, { recursive: true, force: true });
    }
    await fs.mkdir(localScreenshotsPath, { recursive: true });
}

export async function uploadResults() {
    console.log("Uploading screenshots");

    // upload current
    const files = await fs.readdir(localScreenshotsPath);
    await Promise.all(
        files.map(async (file) => {
            await storage
                .bucket(bucketName)
                .upload(`${localScreenshotsPath}/${file}`, {
                    destination: `current/${file}`,
                });
        })
    );
}
