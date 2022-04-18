import React from "react";
import {
    createDraftAnnotation,
    hypothesisToLindyFormat,
} from "../common/annotations/getAnnotations";
import { getHypothesisUsername } from "../common/annotations/storage";
import {
    createAnnotation as createAnnotationApi,
    deleteAnnotation as deleteAnnotationApi,
    getAnnotations,
} from "./common/api";
import AnnotationsList from "./components/AnnotationsList";
import LoginMessage from "./components/LoginMessage";
import PageNotesList from "./components/PageNotesList";
// import PopularityMessage from "./components/PopularityMessage";

export default function App({ url }) {
    // fetch state from extension settings
    const [isLoggedIn, setIsLoggedIn] = React.useState(null);
    React.useEffect(async () => {
        const user = await getHypothesisUsername();
        setIsLoggedIn(!!user);
    }, []);

    // keep the annotations state here
    const [annotations, setAnnotations] = React.useState([]);
    // fetch annotations on load
    React.useEffect(async () => {
        const annotations = await getAnnotations(url);
        const pageNotes = annotations.filter((a) => !a.quote_html_selector);
        if (pageNotes.length === 0) {
            pageNotes.push(createDraftAnnotation(url));
        }

        setAnnotations(pageNotes);
        window.top.postMessage(
            { event: "anchorAnnotations", annotations },
            "*"
        );
    }, []);

    // sync local annotation updates to hypothesis
    async function createAnnotation(localAnnotation) {
        const hypothesisAnnotation = await createAnnotationApi(
            url,
            localAnnotation
        );
        const annotation = hypothesisToLindyFormat(
            hypothesisAnnotation,
            localAnnotation.displayOffset
        );
        setAnnotations([
            ...annotations,
            {
                ...annotation,
                displayOffset: localAnnotation.displayOffset,
                localId: localAnnotation.localId,
                isMyAnnotation: true,
            },
        ]);
    }
    function deleteAnnotation(annotation) {
        setAnnotations(annotations.filter((a) => a.id != annotation.id));
        window.top.postMessage({ event: "removeHighlight", annotation }, "*");

        deleteAnnotationApi(annotation.id);
    }

    // receive events from the text highlighting content script code
    window.onmessage = async function ({ data }) {
        if (data.event === "createHighlight") {
            createAnnotation(data.annotation);
        } else if (data.event === "anchoredAnnotations") {
            setAnnotations([...annotations, ...data.annotations]);
        } else if (data.event === "changedDisplayOffset") {
            const updatedAnnotations = annotations.map((a) => ({
                ...a,
                displayOffset:
                    data.offsetById[a.localId] || data.offsetById[a.id],
            }));
            setAnnotations(updatedAnnotations);
        }
    };

    return (
        // x margin to show slight shadow (iframe allows no overflow)
        <div className="mx-2">
            <div className="absolute w-full pr-4 flex flex-col gap-2">
                {/* <PopularityMessage url={url} /> */}
                {isLoggedIn === false && (
                    <LoginMessage onLogin={() => setIsLoggedIn(true)} />
                )}

                {/* <AnnotationsInfoMessage annotations={annotations} /> */}
                {isLoggedIn && (
                    <PageNotesList
                        url={url}
                        annotations={annotations.filter(
                            (a) => !a.quote_html_selector
                        )}
                        createAnnotation={createAnnotation}
                        deleteAnnotation={deleteAnnotation}
                    />
                )}
            </div>
            <AnnotationsList
                url={url}
                annotations={annotations}
                setAnnotations={setAnnotations}
                deleteAnnotation={deleteAnnotation}
                // upvotedAnnotations={upvotedAnnotations}
                // upvoteAnnotation={upvoteAnnotation}
            />
        </div>
    );
}
