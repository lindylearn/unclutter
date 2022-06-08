import { Storage } from "@google-cloud/storage";
import { existsSync, promises as fs } from "fs";

const bucketName = "unclutter-screenshots-serverless";
export const localScreenshotsPath = "./screenshots";

const storage = new Storage(); // use default service account

export async function prepare() {
    if (existsSync(localScreenshotsPath)) {
        fs.rmdir(localScreenshotsPath);
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
