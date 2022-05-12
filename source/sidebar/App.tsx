import React, { useReducer } from "react";
import {
    createDraftAnnotation,
    LindyAnnotation,
} from "../common/annotations/create";
import { hypothesisSyncFeatureFlag } from "../common/featureFlags";
import { createRemoteAnnotation } from "./common/api";
import {
    createAnnotation,
    deleteAnnotation,
    getAnnotations,
} from "./common/CRUD";
import { groupAnnotations } from "./common/grouping";
import { useAnnotationSettings, useFeatureFlag } from "./common/hooks";
import { hideAnnotationLocally } from "./common/local";
import AnnotationsList from "./components/AnnotationsList";

interface AnnotationMutation {
    action: "set" | "add" | "remove" | "update";
    annotation?: LindyAnnotation;
    annotations?: LindyAnnotation[];
}

function annotationReducer(
    annotations: LindyAnnotation[],
    mutation: AnnotationMutation
): LindyAnnotation[] {
    console.log(mutation);

    switch (mutation.action) {
        case "set":
            return mutation.annotations;
        case "add":
            return [
                ...annotations.map((a) => ({ ...a, focused: false })),
                ,
                mutation.annotation,
            ];
        case "remove":
            return annotations.filter(
                (a) => a.localId !== mutation.annotation.localId
            );
        case "update":
            return [
                ...annotations.filter(
                    (a) => a.localId !== mutation.annotation.localId
                ),
                mutation.annotation,
            ];
    }
}

export default function App({ url }) {
    // extension settings
    const hypothesisSyncEnabled = useFeatureFlag(hypothesisSyncFeatureFlag);

    // annotation settings (updated through events below)
    const {
        personalAnnotationsEnabled,
        setPersonalAnnotationsEnabled,
        showSocialAnnotations,
        setShowSocialAnnotations,
    } = useAnnotationSettings();

    // keep the annotations state here
    const [annotations, mutateAnnotations] = useReducer(annotationReducer, []);

    React.useEffect(() => {
        (async function () {
            const annotations = await getAnnotations(
                url,
                personalAnnotationsEnabled,
                showSocialAnnotations
            );
            if (annotations.length === 0) {
                // skip anchoring
                mutateAnnotations({ action: "set", annotations: [] });
                return;
            }

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
    }, [personalAnnotationsEnabled, showSocialAnnotations]);

    // sync local annotation updates to hypothesis
    async function createAnnotationHandler(localAnnotation: LindyAnnotation) {
        // show state with localId immediately
        localAnnotation = { ...localAnnotation, focused: true };
        mutateAnnotations({ action: "add", annotation: localAnnotation });

        // update remotely, then replace local state
        const remoteAnnotation = await createAnnotation(localAnnotation);
        mutateAnnotations({ action: "update", annotation: remoteAnnotation });
    }

    async function createReply(
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

        const remoteAnnotation = await createRemoteAnnotation(reply);

        function updateIdDfs(current: LindyAnnotation) {
            if (current.localId === remoteAnnotation.localId) {
                current.id = remoteAnnotation.id;
                return;
            }

            current.replies.map(updateIdDfs);
        }
        updateIdDfs(threadStart);
        mutateAnnotations({ action: "update", annotation: threadStart });
    }

    function deleteHideAnnotationHandler(
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
                    { event: "removeHighlight", annotation },
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
    }
    function onAnnotationHoverUpdate(
        annotation: LindyAnnotation,
        hoverActive: boolean
    ) {
        window.top.postMessage(
            { event: "onAnnotationHoverUpdate", annotation, hoverActive },
            "*"
        );
    }

    // receive events from the text highlighting content script code
    // use .onmessage instead of addEventListener to overwrite handler with hook setters (?)
    window.onmessage = ({ data }) => {
        if (data.event === "createHighlight") {
            createAnnotationHandler(data.annotation);
        } else if (data.event === "anchoredAnnotations") {
            mutateAnnotations({ action: "set", annotations: data.annotations });
        } else if (data.event === "changedDisplayOffset") {
            let updatedAnnotations = annotations.map((a) => ({
                ...a,
                displayOffset: data.offsetById[a.localId],
                displayOffsetEnd: data.offsetEndById[a.localId],
            }));
            mutateAnnotations({
                action: "set",
                annotations: updatedAnnotations,
            });
        } else if (data.event === "setShowSocialAnnotations") {
            setShowSocialAnnotations(data.showSocialAnnotations);
        } else if (data.event === "setEnablePersonalAnnotations") {
            setPersonalAnnotationsEnabled(data.enablePersonalAnnotations);
        }
    };

    const [groupedAnnotations, setGroupedAnnotations] = React.useState([]);
    React.useEffect(() => {
        const groupedAnnotations = groupAnnotations(annotations);
        setGroupedAnnotations(groupedAnnotations);
    }, [annotations]);

    // console.log(annotations, groupedAnnotations);

    return (
        // x margin to show slight shadow (iframe allows no overflow)
        <div className="font-paragraph text-gray-700 mx-2">
            <AnnotationsList
                groupedAnnotations={groupedAnnotations}
                deleteHideAnnotation={deleteHideAnnotationHandler}
                onAnnotationHoverUpdate={onAnnotationHoverUpdate}
                hypothesisSyncEnabled={hypothesisSyncEnabled}
                createReply={createReply}
            />
        </div>
    );
}
