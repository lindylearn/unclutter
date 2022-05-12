import { LindyAnnotation } from "../../common/annotations/create";

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
