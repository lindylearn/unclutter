import { getUrlHash, normalizeUrl } from "@unclutter/library-components/dist/common";
import { Annotation, Article } from "@unclutter/library-components/dist/store";
import { groupBy } from "lodash";
import { LindyAnnotation, pickleLocalAnnotation } from "../../common/annotations/create";
import { getFeatureFlag, hypothesisSyncFeatureFlag } from "../../common/featureFlags";
import { constructLocalArticleInfo } from "../../common/schema";
import {
    createRemoteAnnotation,
    deleteRemoteAnnotation,
    getHypothesisAnnotationsSince,
    getPersonalHypothesisAnnotations,
    updateRemoteAnnotation,
} from "../../sidebar/common/api";
import { deleteAllLegacyAnnotations, getAllLegacyAnnotations } from "../../sidebar/common/legacy";
import { processReplicacheMessage, rep } from "./library";

export async function initHighlightsSync() {
    try {
        await importLegacyAnnotations();
    } catch (err) {
        console.error(err);
    }

    const hypothesisSyncEnabled = await getFeatureFlag(hypothesisSyncFeatureFlag);
    if (hypothesisSyncEnabled) {
        try {
            await fetchRemoteAnnotations();

            // wait to avoid uploading fetched annotations
            await new Promise((resolve) => setTimeout(resolve, 5000));

            await watchLocalAnnotations();
        } catch (err) {
            console.error(err);
        }
    }

    console.log("Annotations sync done");
}

async function importLegacyAnnotations() {
    const annotations = await getAllLegacyAnnotations();
    if (annotations.length === 0) {
        return;
    }

    console.log(`Migrating ${annotations.length} legacy annotations to replicache...`);
    await importAnnotations(annotations);

    await deleteAllLegacyAnnotations();
}

async function fetchRemoteAnnotations() {
    // TODO add last sync date

    const annotations = await getHypothesisAnnotationsSince(null, 200);

    console.log(`Importing ${annotations.length} hypothes.is annotations to replicache...`);
    await importAnnotations(annotations.slice(0, 10));
}

let watchActive = false;
async function watchLocalAnnotations() {
    if (watchActive) {
        return;
    }
    watchActive = true;

    rep.watch("annotations/", async (changed: Annotation[], removed: Annotation[]) => {
        if (changed.length === 0 && removed.length === 0) {
            return;
        }

        console.log(
            `Uploading ${changed.length + removed.length} annotation changes to hypothesis...`
        );

        // fetch articles
        const articleIds = Object.keys(groupBy(changed, (a) => a.article_id));
        const articles = await Promise.all(
            articleIds.map((articleId) => rep.query.getArticle(articleId))
        );
        const articleMap: { [articleId: string]: Article } = articles.reduce((acc, article) => {
            acc[article.id] = article;
            return acc;
        }, {});

        // upload changes
        await Promise.all(
            changed.map(async (annotation) => {
                const article = articleMap[annotation.article_id];

                if (annotation.h_id) {
                    // already exists remotely
                    return updateRemoteAnnotation(annotation);
                } else {
                    // create remotely, then save id
                    const remoteId = await createRemoteAnnotation(
                        annotation,
                        article.url,
                        article.title
                    );
                    await processReplicacheMessage({
                        type: "mutate",
                        methodName: "updateAnnotation",
                        args: {
                            id: annotation.id,
                            h_id: remoteId,
                        },
                    });
                }
            })
        );

        // upload deletes
        await Promise.all(removed.map((annotation) => deleteRemoteAnnotation(annotation)));
    });
}

async function importAnnotations(annotations: LindyAnnotation[]) {
    // fetch article state
    const annotationsPerArticle = groupBy(annotations, (a) => a.url);
    const urls = Object.keys(annotationsPerArticle);

    let articleInfos = urls.map((url) =>
        constructLocalArticleInfo(url, getUrlHash(url), normalizeUrl(url))
    );

    articleInfos = articleInfos.map((articleInfo) => {
        articleInfo.article.reading_progress = 1.0;

        const articleAnnotations = annotationsPerArticle[articleInfo.article.url];
        if (articleAnnotations.length > 0) {
            articleInfo.article.time_added = Math.round(
                new Date(articleAnnotations[0].created_at).getTime() / 1000
            );
        }

        return articleInfo;
    });

    // insert articles
    await Promise.all(
        articleInfos.map((articleInfo) =>
            processReplicacheMessage({
                type: "mutate",
                methodName: "putArticleIfNotExists",
                args: articleInfo.article,
            })
        )
    );

    // insert annotations
    await Promise.all(
        annotations.map((a) =>
            processReplicacheMessage({
                type: "mutate",
                methodName: "putAnnotation",
                args: pickleLocalAnnotation(a),
            })
        )
    );
}
