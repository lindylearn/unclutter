import React, { useMemo, useReducer, useState } from "react";
import { LindyAnnotation } from "../common/annotations/create";
import { groupAnnotations } from "./common/grouping";
import { useAnnotationSettings } from "./common/hooks";
import AnnotationsList from "./components/AnnotationsList";
import { useAnnotationModifiers, useFetchAnnotations } from "./state/actions";
import { annotationReducer, handleWindowEventFactory } from "./state/local";

export default function App({ articleUrl }: { articleUrl: string }) {
    // annotation settings (updated through events below)
    const {
        personalAnnotationsEnabled,
        setPersonalAnnotationsEnabled,
        enableSocialAnnotations,
        showAllSocialAnnotations,
        setEnableSocialAnnotations,
        experimentsEnabled,
    } = useAnnotationSettings();

    // keep local annotations state
    const [summaryAnnotation, setSummaryAnnotation] = useState<LindyAnnotation>();
    const [annotations, mutateAnnotations] = useReducer(annotationReducer, []);
    useFetchAnnotations(
        articleUrl,
        personalAnnotationsEnabled,
        enableSocialAnnotations,
        mutateAnnotations
    );

    // handlers to modify remote & local state
    const { deleteHideAnnotation, onAnnotationHoverUpdate, updateAnnotation } =
        useAnnotationModifiers(mutateAnnotations);

    // receive events from the text highlighting content script code
    useMemo(() => {
        window.onmessage = handleWindowEventFactory(
            mutateAnnotations,
            setEnableSocialAnnotations,
            setPersonalAnnotationsEnabled,
            setSummaryAnnotation
        );
        window.top.postMessage({ event: "sidebarAppReady" }, "*");
    }, []);

    // group and filter annotations on every local state change (e.g. added, focused)
    const [groupedAnnotations, setGroupedAnnotations] = useState<LindyAnnotation[][]>([]);
    React.useEffect(() => {
        annotations
            .filter((a) => a.isMyAnnotation)
            .sort((a, b) => a.displayOffset - b.displayOffset)
            .forEach((a, index) => {
                a.listIndex = index;
            });

        const visibleAnnotations = annotations.filter(
            (a) =>
                a.focused ||
                a.platform === "info" ||
                (a.isMyAnnotation && (a.text || experimentsEnabled))
        );

        if (summaryAnnotation) {
            // prepend summary annotation to the list
            visibleAnnotations.unshift(summaryAnnotation);
        }

        // use large grouping margin to display every annotation properly
        const groupedAnnotations = groupAnnotations(visibleAnnotations, 75);
        setGroupedAnnotations(groupedAnnotations);
    }, [annotations, summaryAnnotation]);

    return (
        // x margin to show slight shadow (iframe allows no overflow)
        <div className="app font-text mx-2 text-stone-800">
            <AnnotationsList
                groupedAnnotations={groupedAnnotations}
                deleteHideAnnotation={deleteHideAnnotation}
                onAnnotationHoverUpdate={onAnnotationHoverUpdate}
                unfocusAnnotation={onAnnotationHoverUpdate}
                updateAnnotation={updateAnnotation}
            />
        </div>
    );
}
