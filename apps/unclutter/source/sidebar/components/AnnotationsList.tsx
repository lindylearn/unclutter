import debounce from "lodash/debounce";
import React, { useLayoutEffect, useRef, useState } from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { LindyAnnotation } from "../../common/annotations/create";
import AnnotationThread from "./AnnotationThread";

const sidebarOffsetTopPx = 8;

interface AnnotationsListProps {
    groupedAnnotations: LindyAnnotation[][];
    hypothesisSyncEnabled: boolean;
    showAllSocialAnnotations: boolean;
    deleteHideAnnotation: (annotation: LindyAnnotation, threadStart: LindyAnnotation) => void;
    onAnnotationHoverUpdate: (annotation: LindyAnnotation, hoverActive: boolean) => void;
    unfocusAnnotation: (annotation: LindyAnnotation) => void;
    createReply: (parent: LindyAnnotation, threadStart: LindyAnnotation) => void;
    updateAnnotation: (annotation: LindyAnnotation) => void;
}

const annotationMarginPx = 8;

function AnnotationsList({
    groupedAnnotations,
    hypothesisSyncEnabled,
    showAllSocialAnnotations,
    deleteHideAnnotation,
    onAnnotationHoverUpdate,
    unfocusAnnotation,
    createReply,
    updateAnnotation,
}: AnnotationsListProps) {
    const itemsRef = useRef({}); // annotation id -> ref of rendered annotation node

    const [_, rerender] = useState(0); // state to force re-renders
    const [resizeObserver, setResizeObserver] = useState(null);
    useLayoutEffect(() => {
        // called whenever visible annotations change, after up-to-date refs are available

        if (groupedAnnotations.length === 0) {
            return;
        }

        // observe textarea resize events to trigger re-renders
        let observer = resizeObserver;
        if (!resizeObserver) {
            let initialCall = true; // ignore insert call
            const handleResize = () => {
                if (initialCall) {
                    initialCall = false;
                    return;
                }
                console.log("Annotation draft resized, triggering rerender");
                rerender(Math.random());
            };

            observer = new ResizeObserver(debounce(handleResize, 100));
            setResizeObserver(observer);
        }
        // calling observe multiple times on same node is fine
        groupedAnnotations
            .flatMap((group) => group)
            .filter((a) => a.isMyAnnotation)
            .map((a) => {
                const ref = itemsRef.current[a.id];
                observer.observe(ref);
            });

        // every time the displayed annotations change, trigger a second pass render (before first is completed)
        // this allows grouped annotations to access the rendered height of their siblings
        rerender(Math.random());
    }, [groupedAnnotations]);

    return (
        <TransitionGroup className="annotation-list relative">
            {/* render annotations in flat list to animate fade-out and regroups */}
            {groupedAnnotations.flatMap((group, groupIndex) => {
                // const nextGroup =
                //     groupIndex < groupedAnnotations.length - 1 &&
                //     groupedAnnotations[groupIndex + 1];
                // const groupHeightLimitPx =
                //     (nextGroup?.[0]?.displayOffset ||
                //         document.documentElement.scrollHeight +
                //             sidebarOffsetTopPx) -
                //     group[0].displayOffset -
                //     annotationMarginPx;

                const groupTopOffset = Math.max(0, group[0].displayOffset - sidebarOffsetTopPx);

                return group.map((annotation, i) => {
                    // items are in flat list, so must track previous group items for correct absolute position
                    const prevSiblingsRefs = group.slice(0, i).map((a) => itemsRef.current?.[a.id]);

                    // get absolute offset after the group start
                    let innerGroupOffset: number;
                    if (i === 0) {
                        // first item in group (most common case)
                        innerGroupOffset = 0;
                    } else if (prevSiblingsRefs.some((a) => !a)) {
                        // first pass render: not all siblings have rendered yet
                        // for now, assume default height (for draft empty comments)
                        innerGroupOffset = 68 * i;
                    } else {
                        // second pass render: know heights of previous siblings
                        // sum them up to get correct offset inside group
                        innerGroupOffset = prevSiblingsRefs
                            .map((ref) => ref.clientHeight)
                            .reduce((sum, height) => sum + height + annotationMarginPx, 0);
                    }

                    return (
                        <CSSTransition
                            key={annotation.id}
                            timeout={500} // must be larger than animation duration
                            classNames="annotation-list-item"
                        >
                            <div
                                key={annotation.id}
                                className="annotation-list-item absolute w-full"
                                style={{
                                    top: groupTopOffset + innerGroupOffset,
                                    maxWidth: "250px",
                                }}
                                ref={(el) => {
                                    if (el) {
                                        itemsRef.current[annotation.id] = el;
                                    } else {
                                        delete itemsRef.current[annotation.id];
                                    }
                                }}
                            >
                                <AnnotationThread
                                    annotation={annotation}
                                    deleteHideAnnotation={deleteHideAnnotation}
                                    // heightLimitPx={
                                    //     groupHeightLimitPx / group.length
                                    // } // give each item equal share -- always avoids overflows
                                    onHoverUpdate={(hoverActive: boolean) =>
                                        // call hover on top level annotation
                                        onAnnotationHoverUpdate(annotation, hoverActive)
                                    }
                                    unfocusAnnotation={unfocusAnnotation}
                                    hypothesisSyncEnabled={hypothesisSyncEnabled}
                                    createReply={createReply}
                                    updateAnnotation={updateAnnotation}
                                />
                            </div>
                        </CSSTransition>
                    );
                });
            })}
        </TransitionGroup>
    );
}
export default AnnotationsList;
