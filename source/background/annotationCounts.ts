import { getUrlHash } from "../common/url";

// The extension fetches this remote configuration text record once to display the number
// of shown social comments per (hashed) URL the user visits.
// lindylearn.io is the official publisher domain for this browser extension.
const staticFileUrl = "https://s3.lindylearn.io/unclutter-url-counts-v2.csv";

// Load the URL counts map to memory for faster lookup
const annotationCounts = {};
export async function loadAnnotationCountsToMemory() {
    try {
        const response = await fetch(staticFileUrl);
        const text = await response.text();

        let start = performance.now();

        const lines = text.split("\r\n");
        lines.map((line) => {
            const [hash, count] = line.split(",");
            annotationCounts[hash] = count;
        });

        let duration = Math.round(performance.now() - start);
        console.log(
            `Loaded ${lines.length} annotation counts to memory in ${duration}ms`
        );
    } catch (err) {
        console.error(`Failed to load URL counts:`, err);
    }
}

export async function getSocialCommentsCount(
    url: string
): Promise<number | null> {
    const hash = getUrlHash(url).slice(0, 32);
    return annotationCounts[hash] || null;
}
