import React, { useEffect, useMemo, useReducer, useState } from "react";
import { LindyAnnotation } from "../common/annotations/create";
import { hypothesisSyncFeatureFlag } from "../common/featureFlags";
import { groupAnnotations } from "./common/grouping";
import { useAnnotationSettings, useFeatureFlag } from "./common/hooks";
import AnnotationsList from "./components/AnnotationsList";
import { useAnnotationModifiers, useFetchAnnotations } from "./state/actions";
import { annotationReducer, handleWindowEventFactory } from "./state/local";

export default function App({ url, title }) {
    // extension settings
    const hypothesisSyncEnabled = useFeatureFlag(hypothesisSyncFeatureFlag);

    // annotation settings (updated through events below)
    const {
        personalAnnotationsEnabled,
        setPersonalAnnotationsEnabled,
        enableSocialAnnotations,
        showAllSocialAnnotations,
        setShowAllSocialAnnotations,
    } = useAnnotationSettings();

    // keep local annotations state
    const [annotations, mutateAnnotations] = useReducer(annotationReducer, []);
    useFetchAnnotations(
        url,
        personalAnnotationsEnabled,
        enableSocialAnnotations,
        showAllSocialAnnotations,
        mutateAnnotations
    );

    // handlers to modify remote & local state
    const {
        createReply,
        deleteHideAnnotation,
        onAnnotationHoverUpdate,
        updateAnnotation,
    } = useAnnotationModifiers(mutateAnnotations);

    // receive events from the text highlighting content script code
    useMemo(() => {
        window.onmessage = handleWindowEventFactory(
            mutateAnnotations,
            setShowAllSocialAnnotations,
            setPersonalAnnotationsEnabled,
            title
        );
    }, []);

    // group and filter annotations by their position on the page
    const [groupedAnnotations, setGroupedAnnotations] = useState<
        LindyAnnotation[][]
    >([]);
    React.useEffect(() => {
        const groupedAnnotations = groupAnnotations(annotations);
        const displayedAnnotations = groupedAnnotations.flatMap(
            (group) => group
        );

        if (displayedAnnotations.length !== annotations.length) {
            // hidden some annotations during grouping, remove them for cleaner UI
            const displayedAnnotationsSet = new Set(displayedAnnotations);
            const droppedAnnotations = annotations.filter(
                (a) => !displayedAnnotationsSet.has(a)
            );

            mutateAnnotations({
                action: "set",
                annotations: displayedAnnotations,
            });
            window.top.postMessage(
                { event: "removeHighlights", annotations: droppedAnnotations },
                "*"
            );
        } else {
            // display only in second pass
            setGroupedAnnotations(groupedAnnotations);

            // TODO only show dots on first render?
            window.top.postMessage(
                {
                    event: "showHighlightDotsFor",
                    annotations: displayedAnnotations.filter(
                        (a) => !a.isMyAnnotation
                    ),
                },
                "*"
            );
        }
    }, [annotations]);

    // hide social annotations after grouping to not layout shift
    // TODO: potentially this causes weird grouping for personal annotations?
    const [filteredGroupedAnnotations, setFilteredGroupedAnnotations] =
        useState<LindyAnnotation[][]>([]);
    useEffect(() => {
        if (!showAllSocialAnnotations) {
            const filteredGroupedAnnotations = groupedAnnotations.map((group) =>
                group.map((a) => ({
                    ...a,
                    hidden: !a.isMyAnnotation,
                }))
            );
            setFilteredGroupedAnnotations(filteredGroupedAnnotations);
        } else {
            setFilteredGroupedAnnotations(groupedAnnotations);
        }
    }, [groupedAnnotations, showAllSocialAnnotations]);

    return (
        // x margin to show slight shadow (iframe allows no overflow)
        <div className="font-paragraph text-gray-700 mx-2">
            <AnnotationsList
                groupedAnnotations={filteredGroupedAnnotations}
                hypothesisSyncEnabled={hypothesisSyncEnabled}
                deleteHideAnnotation={deleteHideAnnotation}
                onAnnotationHoverUpdate={onAnnotationHoverUpdate}
                createReply={createReply}
                updateAnnotation={updateAnnotation}
            />
        </div>
    );
}
