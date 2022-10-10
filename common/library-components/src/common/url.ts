import sha256 from "crypto-js/sha256";

export function getUrlHash(url: string): string {
    const normalizedUrl = normalizeUrl(url);
    const hash = sha256(normalizedUrl).toString();

    return hash;
}

// NOTE: Keep in sync with backend WebpageConstuctor.normalize_url()
export function normalizeUrl(url: string): string {
    // remove protocol
    url = url
        .toLowerCase()
        .replace("www.", "")
        .replace(".html", "")
        .replace(".htm", "");

    // remove url params
    // NOTE: be careful here -- e.g. substack adds ?s=r
    const url_obj = new URL(url);
    // @ts-ignore
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

function trimRight(s: string, chars: string): string {
    let r = s.length - 1;
    while (chars.indexOf(s[r]) >= 0 && r >= 0) {
        r--;
    }
    return s.slice(0, r + 1);
}
