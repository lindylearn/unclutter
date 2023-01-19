import { reportEventContentScript } from "@unclutter/library-components/dist/common/messaging";
import { ReplicacheProxy } from "@unclutter/library-components/dist/common/replicache";
import {
    ReplicacheContext,
    UserInfo,
    useSubscribe,
} from "@unclutter/library-components/dist/store";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { LindyAnnotation, unpickleLocalAnnotation } from "../common/annotations/create";
import { createAnnotation, deleteAnnotation } from "./common/CRUD";
import { groupAnnotations } from "./common/grouping";
import { useAnnotationSettings } from "./common/hooks";
import { hideAnnotationLocally } from "./common/legacy";
import AnnotationsList from "./components/AnnotationsList";
import { SidebarContext } from "./context";

export default function App({ articleId }: { articleId: string }) {
    const rep = useMemo<ReplicacheProxy>(() => new ReplicacheProxy(), []);

    // one-time fetch of user info
    const [userInfo, setUserInfo] = useState<UserInfo | undefined>();
    useEffect(() => {
        rep?.query.getUserInfo().then(setUserInfo);
    }, [rep]);

    // settings state (updated through window events below)
    const {
        personalAnnotationsEnabled,
        setPersonalAnnotationsEnabled,
        enableSocialAnnotations,
        setEnableSocialAnnotations,
    } = useAnnotationSettings();

    const [focusedAnnotationId, setFocusedAnnotationId] = useState<string | null>(null);
    const [displayOffsets, setDisplayOffsets] = useState<{ [id: string]: number }>({});
    const [displayOffsetEnds, setDisplayOffsetEnds] = useState<{ [id: string]: number }>({});

    const storeAnnotations = useSubscribe(rep, rep.subscribe.listArticleAnnotations(articleId), []);

    // send annotation add, deletes to highlights anchor code
    const lastAnnotations = useRef<LindyAnnotation[]>([]);
    useEffect(() => {
        if (!storeAnnotations) {
            return;
        }

        const renderedAnnotationsSet = new Set(lastAnnotations.current.map((a) => a.id));
        const storeAnnotationsSet = new Set(storeAnnotations.map((a) => a.id));

        const newAnnotations = storeAnnotations
            .filter((a) => !renderedAnnotationsSet.has(a.id))
            .map(unpickleLocalAnnotation);
        const deletedAnnotations = lastAnnotations.current.filter(
            (a) => !storeAnnotationsSet.has(a.id)
        );

        console.log({ newAnnotations, deletedAnnotations });

        if (deletedAnnotations.length) {
            window.top.postMessage(
                { event: "removeHighlights", annotations: deletedAnnotations },
                "*"
            );
        }
        if (newAnnotations.length) {
            window.top.postMessage(
                {
                    event: "anchorAnnotations",
                    annotations: newAnnotations,
                    removePrevious: false,
                },
                "*"
            );
        }

        lastAnnotations.current = storeAnnotations.map(unpickleLocalAnnotation);
    }, [storeAnnotations]);

    // receive events from the text highlighting content script code
    useMemo(() => {
        // still fetching
        if (userInfo === undefined) {
            return;
        }

        window.onmessage = async function ({ data }) {
            // settings change
            if (data.event === "setShowSocialAnnotations") {
                setEnableSocialAnnotations(data.showSocialAnnotations);
            } else if (data.event === "setEnablePersonalAnnotations") {
                setPersonalAnnotationsEnabled(data.enablePersonalAnnotations);
            }

            // events from highlights anchoring
            if (data.event === "createHighlight") {
                if (!data.annotation) {
                    return;
                }

                // create in data store
                setFocusedAnnotationId(data.annotation.id);
                await createAnnotation(userInfo.id, data.annotation);
            } else if (data.event === "anchoredAnnotations") {
                // TODO re-add social filtering

                setDisplayOffsets((prev) => ({ ...prev, ...data.offsetById }));
                setDisplayOffsetEnds((prev) => ({ ...prev, ...data.offsetEndById }));

                // display selected annotations
                window.top.postMessage(
                    { event: "paintHighlights", annotations: data.annotations },
                    "*"
                );
            } else if (data.event === "changedDisplayOffset") {
                setDisplayOffsets((prev) => ({ ...prev, ...data.offsetById }));
                setDisplayOffsetEnds((prev) => ({ ...prev, ...data.offsetEndById }));
            } else if (data.event === "focusAnnotation") {
                setFocusedAnnotationId(data.annotation.id);
            }
        };

        window.top.postMessage({ event: "sidebarAppReady" }, "*");
        window.onkeydown = (e: KeyboardEvent) => {
            if (e.key === "Tab") {
                window.top?.postMessage({ event: "showModal" }, "*");
                e.preventDefault();
            }
        };
    }, [userInfo]);

    // group and filter annotations on every local state change (e.g. added, focused)
    const [groupedAnnotations, setGroupedAnnotations] = useState<LindyAnnotation[][]>([]);
    React.useEffect(() => {
        console.log("Grouping annotations");

        const visibleAnnotations = storeAnnotations
            .map(unpickleLocalAnnotation)
            .filter((a) => a.isMyAnnotation)
            .map((a) => ({
                ...a,
                focused: a.id === focusedAnnotationId,
                displayOffset: displayOffsets[a.id],
                displayOffsetEnd: displayOffsetEnds[a.id],
            }))
            .sort((a, b) => a.displayOffset - b.displayOffset)
            .filter((a) => a.focused || (a.isMyAnnotation && a.text));

        // use large grouping margin to display every annotation properly
        const groupedAnnotations = groupAnnotations(visibleAnnotations, 75);
        setGroupedAnnotations(groupedAnnotations);
    }, [storeAnnotations, focusedAnnotationId, displayOffsets, displayOffsetEnds]);

    function deleteHideAnnotation(annotation: LindyAnnotation) {
        if (annotation.isMyAnnotation) {
            deleteAnnotation(userInfo.id, annotation);
        } else {
            hideAnnotationLocally(annotation);

            // TODO add to moderation queue
            // hideRemoteAnnotation(annotation);

            reportEventContentScript("hideSocialAnnotation", {
                id: annotation.id,
                platform: annotation.platform,
            });
        }
    }
    function onAnnotationHoverUpdate(annotation: LindyAnnotation, hoverActive: boolean = false) {
        setFocusedAnnotationId(annotation.id);
        window.top.postMessage({ event: "onAnnotationHoverUpdate", annotation, hoverActive }, "*");
    }
    function updateAnnotation() {}

    return (
        // @ts-ignore
        <ReplicacheContext.Provider value={rep}>
            <SidebarContext.Provider value={{ userInfo }}>
                {/* x margin to show slight shadow (iframe allows no overflow) */}
                <div className="app font-text mx-2 text-stone-800">
                    <AnnotationsList
                        groupedAnnotations={groupedAnnotations}
                        deleteHideAnnotation={deleteHideAnnotation}
                        onAnnotationHoverUpdate={onAnnotationHoverUpdate}
                        unfocusAnnotation={onAnnotationHoverUpdate}
                        updateAnnotation={updateAnnotation}
                    />
                </div>
            </SidebarContext.Provider>
        </ReplicacheContext.Provider>
    );
}
