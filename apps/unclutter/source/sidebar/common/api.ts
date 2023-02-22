import type { LindyAnnotation } from "../../common/annotations/create";
import { getHypothesisUsername } from "../../common/annotations/storage";

// const lindyApiUrl = "http://127.0.0.1:8000";
const lindyApiUrl = "https://api2.lindylearn.io";

// --- global fetching

// public annotations via lindy api
export async function getLindyAnnotations(articleId: string): Promise<LindyAnnotation[]> {
    try {
        const response = await fetch(
            `${lindyApiUrl}/annotations/?${new URLSearchParams({
                // query API with hash of normalized url to not leak visited articles
                page_hash: articleId,
            })}`
        );
        const json = await response.json();

        const username = await getHypothesisUsername();
        function mapFormat(annotation: any): LindyAnnotation {
            return {
                ...annotation,
                isPublic: true,

                article_id: articleId,
                replies: annotation.replies.map(mapFormat),
                isMyAnnotation: annotation.author === username,
            };
        }
        let annotations: LindyAnnotation[] = json.results.map(mapFormat);

        // don't show large social comments as they are distracting
        // examples: http://johnsalvatier.org/blog/2017/reality-has-a-surprising-amount-of-detail
        annotations = annotations.filter((a) => a.quote_text?.length < 300);

        return annotations;
    } catch (err) {
        console.error(err);
        return [];
    }
}

export async function getPageHistory(url) {
    const response = await fetch(
        `${lindyApiUrl}/annotations/get_page_history?${new URLSearchParams({
            page_url: url,
        })}`
    );
    const json = await response.json();

    return json;
}
