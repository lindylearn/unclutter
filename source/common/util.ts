export function getDomainFrom(url) {
    return url.hostname.replace("www.", "");
}
