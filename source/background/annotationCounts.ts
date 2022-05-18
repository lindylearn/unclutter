import md5 from "md5";

// Lookup the number of known annotations for a given url
// This data is bundled with the extension as .csv to avoid web requests on every page navigation
// Load it to memory when the extension background service worker starts for faster lookup
const annotationCounts = {};
export async function loadAnnotationCountsToMemory() {
    const start = performance.now();

    const staticFile =
        "https://unclutter-counts-url-map.s3.us-east-2.amazonaws.com/counts_v1.csv";
    const response = await fetch(staticFile, { mode: "same-origin" });
    const text = await response.text();

    // TODO read text line by line for performance
    const lines = text.split("\r\n");
    lines.map((line) => {
        const [hash, count] = line.split(",");
        annotationCounts[hash] = count;
    });

    const duration = performance.now() - start;
    console.log(
        `Loaded ${lines.length} annotation counts to memory in ${duration}ms`
    );
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
