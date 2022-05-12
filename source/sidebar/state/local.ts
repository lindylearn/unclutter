import { LindyAnnotation } from "../../common/annotations/create";
import { createAnnotation } from "../common/CRUD";

export interface AnnotationMutation {
    action: "set" | "add" | "remove" | "update" | "changeDisplayOffsets";

    annotation?: LindyAnnotation;
    annotations?: LindyAnnotation[];
    offsetById?: { [id: string]: number };
    offsetEndById?: { [id: string]: number };
}

// modify local state
export function annotationReducer(
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
        case "changeDisplayOffsets":
            return annotations.map((a) => ({
                ...a,
                displayOffset: mutation.offsetById[a.localId],
                displayOffsetEnd: mutation.offsetEndById[a.localId],
            }));
    }
}

export function handleWindowEventFactory(
    mutateAnnotations: React.Dispatch<AnnotationMutation>,
    setShowSocialAnnotations: (enabled: boolean) => void,
    setPersonalAnnotationsEnabled: (enabled: boolean) => void
) {
    return async function ({ data }) {
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
}
