export function highlightExactMatch(
    text: string,
    query: string,
    htmlTag = "match"
) {
    const matchPos = text.toLowerCase().indexOf(query.toLowerCase());
    if (matchPos !== -1) {
        return (
            text.slice(0, matchPos) +
            `<${htmlTag}>` +
            text.slice(matchPos, matchPos + query.length) +
            `</${htmlTag}>` +
            text.slice(matchPos + query.length)
        );
    }
    return text;
}

export const googleSearchDomains = [
    "google.com",
    "google.com.vn",
    "google.com.au",
    "google.com.tw",
    "google.com.br",
    "google.com.tr",
    "google.com.gr",
    "google.com.mx",
    "google.com.ar",
    "google.com.co",
    "google.com.pk",
    "google.co.jp",
    "google.co.uk",
    "google.co.in",
    "google.co.kr",
    "google.es",
    "google.pl",
    "google.pt",
    "google.ie",
    "google.cl",
    "google.at",
    "google.dk",
    "google.be",
    "google.ca",
    "google.de",
    "google.it",
    "google.fr",
    "google.nl",
    // only /search doesn't seem to work
].map((domain) => `https://www.${domain}/*`);
