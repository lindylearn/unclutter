import { UserInfo, userInfoStore } from "../common/settings";

// Report usage metrics
// See https://github.com/lindylearn/unclutter/blob/main/docs/metrics.md
let userInfo: UserInfo = null;
export async function reportEvent(name: string, data = {}) {
    if (process.env.NODE_ENV === "development") {
        console.log("metric", name, data);
        return;
    }

    try {
        if (!userInfo?.userId) {
            userInfo = await userInfoStore.get();
        }

        await fetch(`https://app.posthog.com/capture`, {
            method: "POST",
            body: JSON.stringify({
                api_key: "phc_fvlWmeHRjWGBHLXEmhtwx8vp5mSNHq63YbvKE1THr2r",
                distinct_id: userInfo?.userId,
                event: name,
                properties: {
                    $useragent: navigator.userAgent,
                    $current_url: "newtab",
                    ...data,
                },
            }),
        });
    } catch (err) {
        console.error(`Error reporting metric:`, err);
    }
}
