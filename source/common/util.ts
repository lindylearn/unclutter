export function getDomainFrom(url: URL) {
    return url.hostname.replace("www.", "");
}
