import * as Sentry from "@sentry/browser";

export function initErrorLogs(isDev: boolean) {
    Sentry.init({
        enabled: !isDev,
        dsn: "https://284d55f388b5433c8ab4ae9a21c5ac2d@o1388847.ingest.sentry.io/6711548",
        tracesSampleRate: 1.0,
    });
}

export function captureErrors<T>(wrappedFunction: () => T): T {
    return Sentry.wrap(wrappedFunction);
}
