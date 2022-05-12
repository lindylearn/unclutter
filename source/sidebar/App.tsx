import React, { useMemo, useReducer } from "react";
import { hypothesisSyncFeatureFlag } from "../common/featureFlags";
import { groupAnnotations } from "./common/grouping";
import { useAnnotationSettings, useFeatureFlag } from "./common/hooks";
import AnnotationsList from "./components/AnnotationsList";
import { useAnnotationModifiers, useFetchAnnotations } from "./state/actions";
import { annotationReducer, handleWindowEventFactory } from "./state/local";

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

    // keep local annotations state
    const [annotations, mutateAnnotations] = useReducer(annotationReducer, []);
    useFetchAnnotations(
        url,
        personalAnnotationsEnabled,
        showSocialAnnotations,
        mutateAnnotations
    );

    // handlers to modify remote & local state
    const { createReply, deleteHideAnnotation, onAnnotationHoverUpdate } =
        useAnnotationModifiers(mutateAnnotations);

    // receive events from the text highlighting content script code
    useMemo(() => {
        window.onmessage = handleWindowEventFactory(
            mutateAnnotations,
            setShowSocialAnnotations,
            setPersonalAnnotationsEnabled
        );
    }, []);

    // group and filter annotations by their position on the page
    const [groupedAnnotations, setGroupedAnnotations] = React.useState([]);
    React.useEffect(() => {
        const groupedAnnotations = groupAnnotations(annotations);
        setGroupedAnnotations(groupedAnnotations);
    }, [annotations]);

    return (
        // x margin to show slight shadow (iframe allows no overflow)
        <div className="font-paragraph text-gray-700 mx-2">
            <AnnotationsList
                groupedAnnotations={groupedAnnotations}
                deleteHideAnnotation={deleteHideAnnotation}
                onAnnotationHoverUpdate={onAnnotationHoverUpdate}
                hypothesisSyncEnabled={hypothesisSyncEnabled}
                createReply={createReply}
            />
        </div>
    );
}
