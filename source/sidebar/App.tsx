import React from "react";
import {
    createDraftAnnotation,
    LindyAnnotation,
} from "../common/annotations/create";
import {
    enableAnnotationsFeatureFlag,
    getFeatureFlag,
    hypothesisSyncFeatureFlag,
    showSocialAnnotationsDefaultFeatureFlag,
    supportSocialAnnotations,
} from "../common/featureFlags";
import { getRemoteFeatureFlag } from "../content-script/messaging";
import { createRemoteAnnotation } from "./common/api";
import {
    createAnnotation,
    deleteAnnotation,
    getAnnotations,
} from "./common/CRUD";
import { hideAnnotationLocally } from "./common/local";
import AnnotationsList from "./components/AnnotationsList";

export default function App({ url }) {
    // fetch extension settings
    const [hypothesisSyncEnabled, setHypothesisSyncEnabled] =
        React.useState(false);
    React.useEffect(() => {
        (async function () {
            const hypothesisSyncEnabled = await getFeatureFlag(
                hypothesisSyncFeatureFlag
            );
            setHypothesisSyncEnabled(hypothesisSyncEnabled);
        })();
    }, []);

    // state updated through events sent from overlay code below
    const [personalAnnotationsEnabled, setPersonalAnnotationsEnabled] =
        React.useState(false);
    const [showSocialAnnotations, setShowSocialAnnotations] =
        React.useState(false);
    React.useEffect(() => {
        (async function () {
            const personalAnnotationsEnabled = await getFeatureFlag(
                enableAnnotationsFeatureFlag
            );

            let showSocialAnnotations = false;
            const supportSocialFeature = await getRemoteFeatureFlag(
                supportSocialAnnotations
            );
            if (supportSocialFeature) {
                showSocialAnnotations = await getFeatureFlag(
                    showSocialAnnotationsDefaultFeatureFlag
                );
            }

            // batch state updates
            setPersonalAnnotationsEnabled(personalAnnotationsEnabled);
            setShowSocialAnnotations(showSocialAnnotations);
        })();
    }, []);

    // keep the annotations state here
    const [annotations, setAnnotations] = React.useState([]);
    React.useEffect(() => {
        (async function () {
            const annotations = await getAnnotations(
                url,
                personalAnnotationsEnabled,
                showSocialAnnotations
            );
            const pageNotes = annotations.filter((a) => !a.quote_html_selector);
            // if (pageNotes.length === 0) {
            //     pageNotes.push(createDraftAnnotation(url, null));
            // }

            // show page notes immediately, others once anchored
            setAnnotations(pageNotes);
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
        setAnnotations([
            ...annotations.map((a) => ({ ...a, focused: false })),
            localAnnotation,
        ]);

        // update remotely, then replace local state
        const remoteAnnotation = await createAnnotation(localAnnotation);
        setAnnotations([
            ...annotations.filter((a) => a.localId !== localAnnotation.localId),
            remoteAnnotation,
        ]);
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
        setAnnotations(
            annotations.filter((a) =>
                a.id === threadStart.id ? threadStart : a
            )
        );

        const remoteAnnotation = await createRemoteAnnotation(reply);

        function updateIdDfs(current: LindyAnnotation) {
            if (current.localId === remoteAnnotation.localId) {
                current.id = remoteAnnotation.id;
                return;
            }

            current.replies.map(updateIdDfs);
        }
        updateIdDfs(threadStart);
        setAnnotations(
            annotations.filter((a) =>
                a.id === threadStart.id ? threadStart : a
            )
        );
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

            setAnnotations(
                annotations.filter((a) =>
                    a.id === threadStart.id ? threadStart : a
                )
            );
        } else {
            // is root, so remove entire thread
            setAnnotations(
                annotations.filter((a) => a.localId !== annotation.localId)
            );
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
    function onAnnotationHoverUpdate(annotation, hoverActive: boolean) {
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
            setAnnotations([...annotations, ...data.annotations]);
        } else if (data.event === "changedDisplayOffset") {
            let updatedAnnotations = annotations.map((a) => ({
                ...a,
                displayOffset: data.offsetById[a.localId],
                displayOffsetEnd: data.offsetEndById[a.localId],
            }));

            setAnnotations(updatedAnnotations);
        } else if (data.event === "setShowSocialAnnotations") {
            setShowSocialAnnotations(data.showSocialAnnotations);
        } else if (data.event === "setEnablePersonalAnnotations") {
            setPersonalAnnotationsEnabled(data.enablePersonalAnnotations);
        }
    };

    return (
        // x margin to show slight shadow (iframe allows no overflow)
        <div className="font-paragraph text-gray-700 mx-2">
            <div className="absolute w-full pr-4 flex flex-col gap-2">
                {/* {isLoggedIn && (
                    <PageNotesList
                        url={url}
                        annotations={annotations.filter(
                            (a) => !a.quote_html_selector
                        )}
                        createAnnotation={createAnnotation}
                    />
                )} */}
            </div>
            <AnnotationsList
                url={url}
                annotations={annotations}
                deleteHideAnnotation={deleteHideAnnotationHandler}
                offsetTop={50}
                onAnnotationHoverUpdate={onAnnotationHoverUpdate}
                hypothesisSyncEnabled={hypothesisSyncEnabled}
                createReply={createReply}
                // upvotedAnnotations={upvotedAnnotations}
                // upvoteAnnotation={upvoteAnnotation}
            />
        </div>
    );
}
