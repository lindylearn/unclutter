import React, { useMemo, useReducer, useState } from "react";
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
        setEnableSocialAnnotations,
    } = useAnnotationSettings();

    // keep local annotations state
    const [annotations, mutateAnnotations] = useReducer(annotationReducer, []);
    useFetchAnnotations(
        url,
        personalAnnotationsEnabled,
        enableSocialAnnotations,
        mutateAnnotations
    );

    // handlers to modify remote & local state
    const {
        createReply,
        deleteHideAnnotation,
        onAnnotationHoverUpdate,
        unfocusAnnotation,
        updateAnnotation,
    } = useAnnotationModifiers(mutateAnnotations);

    // receive events from the text highlighting content script code
    useMemo(() => {
        window.onmessage = handleWindowEventFactory(
            mutateAnnotations,
            setEnableSocialAnnotations,
            setPersonalAnnotationsEnabled,
            title
        );
    }, []);

    // group and filter annotations on every local state change (e.g. added, focused)
    const [groupedAnnotations, setGroupedAnnotations] = useState<
        LindyAnnotation[][]
    >([]);
    React.useEffect(() => {
        const visibleAnnotations = annotations.filter(
            (a) => a.focused || a.text
        );

        // use large grouping margin to display every annotation properly
        const groupedAnnotations = groupAnnotations(visibleAnnotations, 100);
        setGroupedAnnotations(groupedAnnotations);
    }, [annotations]);

    return (
        // x margin to show slight shadow (iframe allows no overflow)
        <div className="mx-2 font-paragraph text-gray-700">
            <AnnotationsList
                groupedAnnotations={groupedAnnotations}
                hypothesisSyncEnabled={hypothesisSyncEnabled}
                showAllSocialAnnotations={showAllSocialAnnotations}
                deleteHideAnnotation={deleteHideAnnotation}
                onAnnotationHoverUpdate={onAnnotationHoverUpdate}
                unfocusAnnotation={unfocusAnnotation}
                createReply={createReply}
                updateAnnotation={updateAnnotation}
            />
        </div>
    );
}
