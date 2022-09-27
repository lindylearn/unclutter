import posthog from "posthog-js";

export function initPosthog() {
    posthog.init("phc_fvlWmeHRjWGBHLXEmhtwx8vp5mSNHq63YbvKE1THr2r", {
        api_host: "https://e.lindylearn.io",
        loaded: (posthog) => {
            if (process.env.NODE_ENV === "development") {
                posthog.opt_out_capturing();
            }
        },
    });
}

export function reportEventPosthog(event: string, properties?: any) {
    if (process.env.NODE_ENV === "development") {
        return;
    }
    posthog.capture(event, properties);
}
