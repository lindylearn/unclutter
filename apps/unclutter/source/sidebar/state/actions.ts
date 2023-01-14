import { useCallback, useEffect } from "react";
import { LindyAnnotation } from "../../common/annotations/create";
import { reportEventContentScript } from "@unclutter/library-components/dist/common/messaging";
import { deleteAnnotation, getAnnotations } from "../common/CRUD";
import { hideAnnotationLocally } from "../common/legacy";
import { AnnotationMutation } from "./local";

// don't show large social comments as they are distracting
// examples: http://johnsalvatier.org/blog/2017/reality-has-a-surprising-amount-of-detail
const maxSocialQuoteLength = 300;

export function useFetchAnnotations(
    articleId: string,
    personalAnnotationsEnabled: boolean,
    enableSocialAnnotations: boolean,
    mutateAnnotations: React.Dispatch<AnnotationMutation>
) {
    useEffect(() => {
        (async function () {
            let annotations = await getAnnotations(
                articleId,
                personalAnnotationsEnabled,
                enableSocialAnnotations
            );

            annotations = annotations.filter(
                (a) => !a.quote_text || a.quote_text.length < maxSocialQuoteLength
            );

            // send anchor event even for empty list in order to remove annotations later

            // TODO re-enable page notes
            // const pageNotes = annotations.filter((a) => !a.quote_html_selector);
            // if (pageNotes.length === 0) {
            //     pageNotes.push(createDraftAnnotation(article_id, null));
            // }
            // show page notes immediately, others once anchored
            // mutateAnnotations({ action: "set", annotations: pageNotes });

            // local state is set in handleWindowEventFactory() once anchored on page
            window.top.postMessage({ event: "anchorAnnotations", annotations }, "*");
        })();
    }, [personalAnnotationsEnabled, enableSocialAnnotations]);
}

export function useAnnotationModifiers(mutateAnnotations: React.Dispatch<AnnotationMutation>) {
    const deleteHideAnnotation = useCallback(deleteHideAnnotationFactory(mutateAnnotations), []);
    const updateAnnotation = useCallback(
        (annotation: LindyAnnotation) => mutateAnnotations({ action: "update", annotation }),
        []
    );
    const onAnnotationHoverUpdate = useCallback(
        onAnnotationHoverUpdateFactory(mutateAnnotations),
        []
    );

    return {
        deleteHideAnnotation,
        onAnnotationHoverUpdate,
        updateAnnotation,
    };
}

function deleteHideAnnotationFactory(mutateAnnotations: React.Dispatch<AnnotationMutation>) {
    return function (annotation: LindyAnnotation, threadStart?: LindyAnnotation) {
        // delete from local state first

        // is root, so remove entire thread
        mutateAnnotations({ action: "remove", annotation: annotation });
        if (annotation.quote_text) {
            window.top.postMessage({ event: "removeHighlights", annotations: [annotation] }, "*");
        }

        // delete or hide remotely
        if (annotation.isMyAnnotation) {
            deleteAnnotation(annotation);
        } else {
            hideAnnotationLocally(annotation);

            // TODO add to moderation queue
            // hideRemoteAnnotation(annotation);

            reportEventContentScript("hideSocialAnnotation", {
                id: annotation.id,
                platform: annotation.platform,
            });
        }
    };
}

function onAnnotationHoverUpdateFactory(mutateAnnotations: React.Dispatch<AnnotationMutation>) {
    return function onAnnotationHoverUpdate(
        annotation: LindyAnnotation,
        hoverActive: boolean = false
    ) {
        if (!hoverActive) {
            mutateAnnotations({
                action: "focusAnnotation",
                annotation: { id: null } as LindyAnnotation,
            });
        }

        window.top.postMessage({ event: "onAnnotationHoverUpdate", annotation, hoverActive }, "*");
    };
}
