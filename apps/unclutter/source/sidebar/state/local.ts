import { LindyAnnotation } from "../../common/annotations/create";
import { reportEventContentScript } from "@unclutter/library-components/dist/common/messaging";
import { createAnnotation } from "../common/CRUD";
import { groupAnnotations } from "../common/grouping";

export interface AnnotationMutation {
    action: "set" | "add" | "remove" | "update" | "changeDisplayOffsets" | "focusAnnotation";

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
    switch (mutation.action) {
        case "set":
            return mutation.annotations;
        case "add":
            const existingAnnotations = annotations.map((a) => ({
                ...a,
                focused: false,
            }));
            if (mutation.annotation) {
                // single annotation
                return [...existingAnnotations, { ...mutation.annotation }];
            } else if (mutation.annotations) {
                // multiple
                return [...existingAnnotations, ...(mutation.annotations || [])];
            }
        case "remove":
            return annotations.filter((a) => a.id !== mutation.annotation.id);
        case "update":
            return annotations.map((a) => {
                if (a.id !== mutation.annotation.id) {
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
            return (
                annotations
                    // null to remove hidden annotations, e.g. from smartHighlights.ts
                    // but don't remove annotations with no present offsets, as udpate from different files
                    .filter((a) => mutation.offsetById[a.id] !== null)
                    .map((a) => ({
                        ...a,
                        displayOffset: mutation.offsetById[a.id] || a.displayOffset,
                        displayOffsetEnd: mutation.offsetEndById[a.id] || a.displayOffsetEnd,
                    }))
            );
        case "focusAnnotation":
            return annotations.map((a) => ({
                ...a,
                focused: a.id === mutation?.annotation?.id, // null to unfocus
            }));
    }
}

export function handleWindowEventFactory(
    mutateAnnotations: React.Dispatch<AnnotationMutation>,
    setEnableSocialAnnotations: (enabled: boolean) => void,
    setPersonalAnnotationsEnabled: (enabled: boolean) => void,
    setSummaryAnnotation: (summaryAnnotation: LindyAnnotation) => void
) {
    return async function ({ data }) {
        if (data.event === "createHighlight") {
            if (!data.annotation) {
                return;
            }

            // show state with id immediately
            mutateAnnotations({ action: "add", annotation: data.annotation });

            // update remotely, then replace local state
            const remoteAnnotation = await createAnnotation(data.annotation);
            mutateAnnotations({
                action: "update",
                annotation: remoteAnnotation,
            });
        } else if (data.event === "anchoredAnnotations") {
            if (data.annotations.length === 0) {
                // shortcut
                mutateAnnotations({
                    action: "add",
                    annotations: [],
                });
                return;
            }

            // now group annotations to filter out overlaps
            // use small margin to just detect overlaps in quotes
            const groupedAnnotations = groupAnnotations(data.annotations, 10);

            const displayedAnnotations = groupedAnnotations.flatMap((group) => group);
            const displayedAnnotationsSet = new Set(displayedAnnotations);
            const droppedAnnotations = data.annotations.filter(
                (a) => !displayedAnnotationsSet.has(a)
            );

            // remove overlapping annotations
            console.log(`Ignoring ${droppedAnnotations.length} overlapping annotations`);
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
                action: "add",
                annotations: displayedAnnotations,
            });
        } else if (data.event === "changedDisplayOffset") {
            // console.log("changedDisplayOffsets", data.offsetById);
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
        } else if (data.event === "setInfoAnnotations") {
            // console.log("setInfoAnnotations", data.annotations);
            mutateAnnotations({ action: "add", annotations: data.annotations });
        } else if (data.event === "setSummaryAnnotation") {
            setSummaryAnnotation(data.summaryAnnotation);
        }
    };
}
