import posthog from "posthog-js";

export function initPosthog() {
    posthog.init("phc_BQHO9btvNLVEbFC4ihMIS8deK5T6P4d8EF75Ihvkfaw", {
        // api_host: "https://e.lindylearn.io", // needs lambda to rewrite host header, see https://gist.github.com/htnosm/2c51a70f0e361056d1fd63321afba4fa
        api_host: "https://app.posthog.com",
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
