import md5 from "md5";

// The extension fetches static text records from this remote file to display
// the number of shown social comments per (hashed) URL the user visits.
// Fetching this static file once instead of on every tab navigation preserves user privacy.
// lindylearn.io is the official publisher domain for this browser extension.
const staticFileUrl = "https://s3.lindylearn.io/unclutter-url-counts-v1.csv";

// Load the URL counts map to memory for faster lookup
const annotationCounts = {};
export async function loadAnnotationCountsToMemory() {
    try {
        const response = await fetch(staticFileUrl, { mode: "same-origin" });
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
    const normalizedUrl = normalizeUrl(url);
    const hash = md5(normalizedUrl);

    return annotationCounts[hash] || null;
}

// NOTE: Keep in sync with backend WebpageConstuctor.normalize_url()
function normalizeUrl(url: string) {
    // remove protocol
    url = url
        .toLowerCase()
        .replace("www.", "")
        .replace(".html", "")
        .replace(".htm", "");

    // remove url params
    // NOTE: be careful here -- e.g. substack adds ?s=r
    const url_obj = new URL(url);
    for (const [param, _] of url_obj.searchParams.entries()) {
        if (param.includes("id")) {
            continue;
        }
        if (["p", "q", "t", "e"].includes(param)) {
            continue;
        }
        delete url_obj.searchParams[param];
    }

    url_obj.pathname = trimRight(url_obj.pathname, "/");

    // convert back to string
    url = url_obj.toString().replace("https://", "").replace("http://", "");

    return url;
}

function trimRight(s: string, chars: string) {
    let r = s.length - 1;
    while (chars.indexOf(s[r]) >= 0 && r >= 0) {
        r--;
    }
    return s.slice(0, r + 1);
}
