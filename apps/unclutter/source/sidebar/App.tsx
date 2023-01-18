import { ReplicacheProxy } from "@unclutter/library-components/dist/common/replicache";
import { ReplicacheContext, UserInfo } from "@unclutter/library-components/dist/store";
import React, { useEffect, useMemo, useReducer, useState } from "react";
import { LindyAnnotation } from "../common/annotations/create";
import { groupAnnotations } from "./common/grouping";
import { useAnnotationSettings } from "./common/hooks";
import AnnotationsList from "./components/AnnotationsList";
import { SidebarContext } from "./context";
import { useAnnotationModifiers, useFetchAnnotations } from "./state/actions";
import { annotationReducer, handleWindowEventFactory } from "./state/local";

export default function App({ articleId }: { articleId: string }) {
    const rep = useMemo<ReplicacheProxy>(() => new ReplicacheProxy(), []);
    const [userInfo, setUserInfo] = useState<UserInfo | undefined>();
    useEffect(() => {
        if (!rep) {
            return;
        }

        rep.query.getUserInfo().then(setUserInfo);
    }, [rep]);

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
        articleId,
        personalAnnotationsEnabled,
        enableSocialAnnotations,
        mutateAnnotations
    );

    // handlers to modify remote & local state
    const { deleteHideAnnotation, onAnnotationHoverUpdate, updateAnnotation } =
        useAnnotationModifiers(userInfo?.id, mutateAnnotations);

    // receive events from the text highlighting content script code
    useMemo(() => {
        // still fetching
        if (userInfo === undefined) {
            return;
        }

        window.onmessage = handleWindowEventFactory(
            userInfo?.id,
            mutateAnnotations,
            setEnableSocialAnnotations,
            setPersonalAnnotationsEnabled,
            setSummaryAnnotation
        );
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
