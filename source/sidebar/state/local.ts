import { LindyAnnotation } from "../../common/annotations/create";
import { reportEventContentScript } from "../../content-script/messaging";
import { createAnnotation } from "../common/CRUD";
import { groupAnnotations } from "../common/grouping";

export interface AnnotationMutation {
    action:
        | "set"
        | "add"
        | "remove"
        | "update"
        | "changeDisplayOffsets"
        | "focusAnnotation";

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
    // console.log(mutation);

    switch (mutation.action) {
        case "set":
            return mutation.annotations;
        case "add":
            return [
                ...annotations.map((a) => ({ ...a, focused: false })),
                { ...mutation.annotation },
            ];
        case "remove":
            return annotations.filter(
                (a) => a.localId !== mutation.annotation.localId
            );
        case "update":
            return annotations.map((a) => {
                if (a.localId !== mutation.annotation.localId) {
                    return a;
                } else {
                    // don't overwrite local focus changes
                    // focused state changed via focusAnnotation below
                    return {
                        ...mutation.annotation,
                        focused: a?.focused || false,
                    };
                }
            });
        case "changeDisplayOffsets":
            return annotations.map((a) => ({
                ...a,
                displayOffset: mutation.offsetById[a.localId],
                displayOffsetEnd: mutation.offsetEndById[a.localId],
            }));
        case "focusAnnotation":
            return annotations.map((a) => ({
                ...a,
                focused: a.localId === mutation?.annotation?.localId, // null to unfocus
            }));
    }
}

export function handleWindowEventFactory(
    mutateAnnotations: React.Dispatch<AnnotationMutation>,
    setEnableSocialAnnotations: (enabled: boolean) => void,
    setPersonalAnnotationsEnabled: (enabled: boolean) => void,
    page_title: string
) {
    return async function ({ data }) {
        if (data.event === "createHighlight") {
            // show state with localId immediately
            mutateAnnotations({ action: "add", annotation: data.annotation });

            // update remotely, then replace local state
            const remoteAnnotation = await createAnnotation(
                data.annotation,
                page_title
            );
            mutateAnnotations({
                action: "update",
                annotation: remoteAnnotation,
            });
        } else if (data.event === "anchoredAnnotations") {
            if (data.annotations.length === 0) {
                // shortcut
                mutateAnnotations({
                    action: "set",
                    annotations: [],
                });
                return;
            }

            // now group annotations to filter out overlaps
            // use small margin to just detect overlaps in quotes
            const groupedAnnotations = groupAnnotations(data.annotations, 10);

            const displayedAnnotations = groupedAnnotations.flatMap(
                (group) => group
            );
            const displayedAnnotationsSet = new Set(displayedAnnotations);
            const droppedAnnotations = data.annotations.filter(
                (a) => !displayedAnnotationsSet.has(a)
            );

            // remove overlapping annotations
            console.log(
                `Ignoring ${droppedAnnotations.length} overlapping annotations`
            );
            window.top.postMessage(
                { event: "removeHighlights", annotations: droppedAnnotations },
                "*"
            );

            // display selected annotations
            window.top.postMessage(
                { event: "paintHighlights", annotations: displayedAnnotations },
                "*"
            );
            mutateAnnotations({
                action: "set",
                annotations: displayedAnnotations,
            });
        } else if (data.event === "changedDisplayOffset") {
            mutateAnnotations({
                action: "changeDisplayOffsets",
                offsetById: data.offsetById,
                offsetEndById: data.offsetEndById,
            });
        } else if (data.event === "setShowSocialAnnotations") {
            setEnableSocialAnnotations(data.showSocialAnnotations);
        } else if (data.event === "setEnablePersonalAnnotations") {
            setPersonalAnnotationsEnabled(data.enablePersonalAnnotations);
        } else if (data.event === "focusAnnotation") {
            mutateAnnotations({
                action: "focusAnnotation",
                annotation: data.annotation as LindyAnnotation,
            });

            if (data.annotation && !data.annotation.isMyAnnotation) {
                reportEventContentScript("clickSocialHighlight", {
                    platform: data.annotation.platform,
                });
            }
        }
    };
}
