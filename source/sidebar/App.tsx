import React, { useReducer } from "react";
import { hypothesisSyncFeatureFlag } from "../common/featureFlags";
import { createAnnotation } from "./common/CRUD";
import { groupAnnotations } from "./common/grouping";
import { useAnnotationSettings, useFeatureFlag } from "./common/hooks";
import AnnotationsList from "./components/AnnotationsList";
import { useAnnotationModifiers, useFetchAnnotations } from "./state/actions";
import { annotationReducer } from "./state/local";

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
    // use .onmessage instead of addEventListener to overwrite handler with hook setters (?)
    window.onmessage = async ({ data }) => {
        if (data.event === "createHighlight") {
            // show state with localId immediately
            mutateAnnotations({ action: "add", annotation: data.annotation });

            // update remotely, then replace local state
            const remoteAnnotation = await createAnnotation(data.annotation);
            mutateAnnotations({
                action: "update",
                annotation: remoteAnnotation,
            });
        } else if (data.event === "anchoredAnnotations") {
            mutateAnnotations({ action: "set", annotations: data.annotations });
        } else if (data.event === "changedDisplayOffset") {
            mutateAnnotations({
                action: "changeDisplayOffsets",
                offsetById: data.offsetById,
                offsetEndById: data.offsetEndById,
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
