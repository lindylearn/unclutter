import { Bucket, getBucket } from "@extend-chrome/storage";
import { useEffect, useState } from "react";

/* *** User authentication info *** */
export interface UserInfo {
    userId: string;
    webJwt: string;
}
export const userInfoStore = getBucket<UserInfo>("user_info", "sync");

/* *** Extension settings *** */
export interface Settings {
    newtabActiveGroupKey?: string;
}
export const settingsStore = getBucket<Settings>("settings", "sync");

export function useSettings<T extends object>(bucket: Bucket<T>): T {
    const [settings, setSettings] = useState<T>();
    useEffect(() => {
        // uses @extend-chrome/storage wrapper library around chrome.storage.sync
        bucket.get().then(setSettings);
    }, []);

    return settings;
}
