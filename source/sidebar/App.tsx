import React from "react";
import { LindyAnnotation } from "../common/annotations/create";
import {
    getFeatureFlag,
    showSocialAnnotationsDefaultFeatureFlag,
} from "../common/featureFlags";
import {
    createAnnotation,
    deleteAnnotation,
    getAnnotations,
} from "./common/CRUD";
import AnnotationsList from "./components/AnnotationsList";

export default function App({ url }) {
    // fetch extension settings
    const [showSocialAnnotations, setShowSocialAnnotations] =
        React.useState(false); // updated through events sent from overlay code
    React.useEffect(async () => {
        const defaultSocialAnnotationsEnabled = await getFeatureFlag(
            showSocialAnnotationsDefaultFeatureFlag
        );
        setShowSocialAnnotations(defaultSocialAnnotationsEnabled);
    }, []);

    // keep the annotations state here
    const [annotations, setAnnotations] = React.useState([]);
    React.useEffect(async () => {
        const annotations = await getAnnotations(url, showSocialAnnotations);
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
    }, [showSocialAnnotations]);

    // sync local annotation updates to hypothesis
    async function createAnnotationHandler(localAnnotation: LindyAnnotation) {
        // show state with localId immediately
        localAnnotation = { ...localAnnotation, focused: true };
        setAnnotations([
            ...annotations.map((a) => ({ ...a, focused: false })),
            localAnnotation,
        ]);

        // show only once reconciled with remote state
        const remoteAnnotation = await createAnnotation(localAnnotation);
        setAnnotations([
            ...annotations.filter((a) => a.localId !== localAnnotation.localId),
            remoteAnnotation,
        ]);
    }

    function deleteAnnotationHandler(annotation: LindyAnnotation) {
        // delete from local state first
        setAnnotations(
            annotations.filter((a) => a.localId != annotation.localId)
        );
        window.top.postMessage({ event: "removeHighlight", annotation }, "*");

        deleteAnnotation(annotation);
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
            }));

            setAnnotations(updatedAnnotations);
        } else if (data.event === "setShowSocialAnnotations") {
            setShowSocialAnnotations(data.showSocialAnnotations);
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
                        deleteAnnotation={deleteAnnotationHandler}
                    />
                )} */}
            </div>
            <AnnotationsList
                url={url}
                annotations={annotations}
                deleteAnnotation={deleteAnnotationHandler}
                offsetTop={50}
                onAnnotationHoverUpdate={onAnnotationHoverUpdate}
                // upvotedAnnotations={upvotedAnnotations}
                // upvoteAnnotation={upvoteAnnotation}
            />
        </div>
    );
}
