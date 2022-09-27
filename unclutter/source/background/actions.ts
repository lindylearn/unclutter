export async function fetchCss(url) {
    try {
        const response = await fetch(url);
        const cssText = await response.text();

        return {
            status: "success",
            cssText,
        };
    } catch (err) {
        return {
            status: "error",
            err,
        };
    }
}
