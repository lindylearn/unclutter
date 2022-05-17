import { useCallback, useEffect } from "react";
import {
    createDraftAnnotation,
    LindyAnnotation,
} from "../../common/annotations/create";
import { createRemoteAnnotation } from "../common/api";
import { deleteAnnotation, getAnnotations } from "../common/CRUD";
import { hideAnnotationLocally } from "../common/local";
import { AnnotationMutation } from "./local";

export function useFetchAnnotations(
    url: string,
    personalAnnotationsEnabled: boolean,
    enableSocialAnnotations: boolean,
    mutateAnnotations: React.Dispatch<AnnotationMutation>
) {
    useEffect(() => {
        (async function () {
            const annotations = await getAnnotations(
                url,
                personalAnnotationsEnabled,
                enableSocialAnnotations
            );

            // TODO re-enable page notes
            // const pageNotes = annotations.filter((a) => !a.quote_html_selector);
            // if (pageNotes.length === 0) {
            //     pageNotes.push(createDraftAnnotation(url, null));
            // }
            // show page notes immediately, others once anchored
            // mutateAnnotations({ action: "set", annotations: pageNotes });

            window.top.postMessage(
                { event: "anchorAnnotations", annotations },
                "*"
            );
        })();
    }, [personalAnnotationsEnabled, enableSocialAnnotations]);
}

export function useAnnotationModifiers(
    mutateAnnotations: React.Dispatch<AnnotationMutation>
) {
    const createReply = useCallback(createReplyFactory(mutateAnnotations), []);
    const deleteHideAnnotation = useCallback(
        deleteHideAnnotationFactory(mutateAnnotations),
        []
    );
    const updateAnnotation = useCallback(
        (annotation: LindyAnnotation) =>
            mutateAnnotations({ action: "update", annotation }),
        []
    );
    const onAnnotationHoverUpdate = useCallback(
        onAnnotationHoverUpdateFactory(mutateAnnotations),
        []
    );

    return {
        createReply,
        deleteHideAnnotation,
        onAnnotationHoverUpdate,
        updateAnnotation,
    };
}

function createReplyFactory(
    mutateAnnotations: React.Dispatch<AnnotationMutation>
) {
    return async function (
        parent: LindyAnnotation,
        threadStart: LindyAnnotation
    ) {
        const reply = createDraftAnnotation(parent.url, null, parent.id);

        // dfs as there may be arbitrary nesting
        function addReplyDfs(current: LindyAnnotation) {
            if (current.id === parent.id) {
                current.replies.push(reply);
                current.reply_count += 1;
                return;
            }

            current.replies.map(addReplyDfs);
        }
        addReplyDfs(threadStart);
        mutateAnnotations({ action: "update", annotation: threadStart });

        const remoteAnnotation = await createRemoteAnnotation(reply, null);

        function updateIdDfs(current: LindyAnnotation) {
            if (current.localId === remoteAnnotation.localId) {
                current.id = remoteAnnotation.id;
                return;
            }

            current.replies.map(updateIdDfs);
        }
        updateIdDfs(threadStart);
        mutateAnnotations({ action: "update", annotation: threadStart });
    };
}

function deleteHideAnnotationFactory(
    mutateAnnotations: React.Dispatch<AnnotationMutation>
) {
    return function (
        annotation: LindyAnnotation,
        threadStart?: LindyAnnotation
    ) {
        // delete from local state first
        if (threadStart) {
            // remove just this reply

            // dfs as there may be arbitrary nesting
            function removeReplyDfs(current: LindyAnnotation) {
                if (current.replies.some((a) => a.id === annotation.id)) {
                    // found reply, modify reference
                    current.replies = current.replies.filter(
                        (a) => a.id !== annotation.id
                    );
                    return;
                }

                current.replies.map(removeReplyDfs);
            }
            removeReplyDfs(threadStart);

            mutateAnnotations({ action: "update", annotation: threadStart });
        } else {
            // is root, so remove entire thread
            mutateAnnotations({ action: "remove", annotation: annotation });
            if (annotation.quote_text) {
                window.top.postMessage(
                    { event: "removeHighlights", annotations: [annotation] },
                    "*"
                );
            }
        }

        // delete or hide remotely (detect if is reply there)
        if (annotation.isMyAnnotation) {
            deleteAnnotation(annotation);
        } else {
            hideAnnotationLocally(annotation);

            // TODO add to moderation queue
            // hideRemoteAnnotation(annotation);
        }
    };
}

function onAnnotationHoverUpdateFactory(
    mutateAnnotations: React.Dispatch<AnnotationMutation>
) {
    return function onAnnotationHoverUpdate(
        annotation: LindyAnnotation,
        hoverActive: boolean
    ) {
        window.top.postMessage(
            { event: "onAnnotationHoverUpdate", annotation, hoverActive },
            "*"
        );

        // TODO handle focus state properly after leaving without causing too many rerenders
        // if (annotation.focused && !hoverActive) {
        //     console.log("unfocus");
        //     mutateAnnotations({ action: "focusAnnotation", annotation: null });
        // }
    };
}
