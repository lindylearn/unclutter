import {
    fetchRelatedAnnotations,
    populateRelatedArticles,
    RelatedHighlight,
} from "@unclutter/library-components/dist/common/api";
import { reportEventContentScript } from "@unclutter/library-components/dist/common/messaging";
import { ReplicacheProxy } from "@unclutter/library-components/dist/common/replicache";
import {
    Annotation,
    ReplicacheContext,
    UserInfo,
    useSubscribe,
} from "@unclutter/library-components/dist/store";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { LindyAnnotation, unpickleLocalAnnotation } from "../common/annotations/create";
import { createAnnotation, deleteAnnotation } from "./common/CRUD";
import { groupAnnotations } from "./common/grouping";
import { useAnnotationSettings } from "./common/hooks";
import AnnotationsList from "./components/AnnotationsList";
import { SidebarContext } from "./context";

const maxRelatedCount = 2;

export default function App({
    articleId,
    sourceAnnotationId,
}: {
    articleId: string;
    sourceAnnotationId: string | null;
}) {
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

    // local display state
    const [focusedAnnotationId, setFocusedAnnotationId] = useState<string | null>(
        sourceAnnotationId
    );
    const [displayOffsets, setDisplayOffsets] = useState<{ [id: string]: number }>({});
    const [displayOffsetEnds, setDisplayOffsetEnds] = useState<{ [id: string]: number }>({});

    // reactive data store (also updated by e.g. the AI highlights)
    const storeAnnotations = useSubscribe(rep, rep.subscribe.listArticleAnnotations(articleId), []);

    // send annotation add, deletes to highlights anchor code
    const lastAnnotations = useRef<LindyAnnotation[]>([]);
    useEffect(() => {
        if (!storeAnnotations || !personalAnnotationsEnabled) {
            // clear lastAnnotations state to re-render all annotations once valid
            lastAnnotations.current = [];
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

        if (deletedAnnotations.length) {
            window.top.postMessage(
                { event: "removeHighlights", annotations: deletedAnnotations },
                "*"
            );
            deletedAnnotations.forEach((a) =>
                relatedPerAnnotation?.[a.id]?.forEach((r) => usedRelatedIds.current.delete(r.id))
            );
            setRelatedPerAnnotation((prev) => {
                const newRelatedPerAnnotation = { ...prev };
                deletedAnnotations.forEach((a) => delete newRelatedPerAnnotation[a.id]);
                return newRelatedPerAnnotation;
            });
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

        // fetch related in batch when first annotations added, and when AI annotations added
        if (
            newAnnotations.length > 0 &&
            (lastAnnotations.current.length === 0 || newAnnotations.some((a) => a.ai_created))
        ) {
            fetchRelatedBatch(storeAnnotations);
        }

        lastAnnotations.current = storeAnnotations.map(unpickleLocalAnnotation);
    }, [storeAnnotations, personalAnnotationsEnabled]);

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
                await createAnnotation(userInfo, data.annotation);
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
                setFocusedAnnotationId(data.annotationId || null);
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

    const [relatedPerAnnotation, setRelatedPerAnnotation] = useState<{
        [id: string]: RelatedHighlight[];
    }>({});
    const usedRelatedIds = useRef(new Set<string>());
    const batchRelatedFetchDone = useRef(false);
    async function fetchRelatedBatch(storeAnnotations: Annotation[]) {
        if (!userInfo?.aiEnabled) {
            return;
        }
        console.log("Fetching related annotations in batch");
        const start = performance.now();
        const fetchedAnnotations = storeAnnotations.filter((a) => a.id !== sourceAnnotationId);
        let groups = await fetchRelatedAnnotations(
            userInfo.id,
            articleId,
            fetchedAnnotations.map((a) => a.quote_text)
        );

        // reset usedRelatedIds
        usedRelatedIds.current = new Set<string>(
            relatedPerAnnotation[sourceAnnotationId]?.map((r) => r.id)
        );

        // deduplicate
        groups = groups.map((group) =>
            group.filter((r) => !usedRelatedIds.current.has(r.id)).slice(0, maxRelatedCount)
        );
        groups.flat().forEach((r) => usedRelatedIds.current.add(r.id));

        await populateRelatedArticles(rep, groups);

        setRelatedPerAnnotation((prev) => {
            groups.forEach((group, i) => {
                const annotation = fetchedAnnotations[i];
                prev[annotation.id] = group;
            });

            return { ...prev };
        });
        batchRelatedFetchDone.current = true;

        const dutationMs = Math.round(performance.now() - start);
        console.log(`Fetched related annotations in ${dutationMs}ms`);
        reportEventContentScript("displayRelatedAnnotations", {
            annotationCount: storeAnnotations.length,
            anchorCount: groups.filter((g) => g.length > 0).length,
            relatedCount: groups.flat().length,
            dutationMs,
        });
    }
    async function fetchRelatedLater(annotation: LindyAnnotation): Promise<void> {
        // console.log("Fetching individual related annotations");
        const isSourceAnnotation = annotation.id === sourceAnnotationId;
        let groups = await fetchRelatedAnnotations(
            userInfo.id,
            articleId,
            [annotation.quote_text],
            isSourceAnnotation ? 0.4 : undefined
        );

        let related = groups[0];
        let removeFromOtherThreads: string[] = [];
        if (isSourceAnnotation) {
            // the user navigated to the article via this annotation
            // so make sure we show all of its related annotations for a nicer UX
            console.log("Showing all related annotations for source annotation.");

            removeFromOtherThreads = related
                .filter((r) => usedRelatedIds.current.has(r.id))
                .map((r) => r.id);
        } else {
            related = related.filter((r) => !usedRelatedIds.current.has(r.id));
        }

        related = related.slice(0, maxRelatedCount);
        related.forEach((r) => usedRelatedIds.current.add(r.id));

        // populate relatedPerAnnotation even with empty list to avoid fetching again
        await populateRelatedArticles(rep, [related]);
        setRelatedPerAnnotation((prev) => {
            if (removeFromOtherThreads.length > 0) {
                for (const [id, other] of Object.entries(prev)) {
                    prev[id] = other.filter((r) => !removeFromOtherThreads.includes(r.id));
                }
            }

            return {
                ...prev,
                [annotation.id]: related,
            };
        });
    }

    useEffect(() => {
        if (!batchRelatedFetchDone.current) {
            return;
        }
        const relatedCount = Object.values(relatedPerAnnotation).flat().length;
        window.top.postMessage({ event: "updateRelatedCount", relatedCount }, "*");
    }, [relatedPerAnnotation]);

    // group and filter annotations on every local state change (e.g. added, focused)
    const [groupedAnnotations, setGroupedAnnotations] = useState<LindyAnnotation[][]>([]);
    useEffect(() => {
        if (!storeAnnotations) {
            return;
        }
        console.log("Grouping annotations");

        // @ts-ignore
        // const summary: LindyAnnotation = {
        //     id: "summary",
        //     platform: "summary",
        //     displayOffset: 1,
        //     displayOffsetEnd: 1,
        //     summaryInfo: {
        //         title: "",
        //         aiAnnotations: storeAnnotations
        //             .filter((a) => a.ai_created)
        //             .map((a) => a.quote_text),
        //         relatedCount: Object.values(relatedPerAnnotation).flat().length,
        //     },
        // };
        // console.log(
        //     storeAnnotations
        //         .filter((a) => a.ai_created)
        //         .map((a) => a.quote_text)
        //         .join("\n")
        // );

        let visibleAnnotations: LindyAnnotation[] = [];
        if (personalAnnotationsEnabled) {
            visibleAnnotations = visibleAnnotations.concat(
                // @ts-ignore
                storeAnnotations
                    .map(unpickleLocalAnnotation)
                    .map((a) => ({
                        ...a,
                        focused: a.id === focusedAnnotationId,
                        displayOffset: displayOffsets[a.id],
                        displayOffsetEnd: displayOffsetEnds[a.id],
                        related: relatedPerAnnotation?.[a.id],
                    }))
                    .filter((a) => a.displayOffset && a.displayOffsetEnd)
                    .sort((a, b) => a.displayOffset - b.displayOffset)
                    .flatMap((a) => [
                        a,
                        ...(a.related?.map((r, i) => ({
                            ...a,
                            ...r,
                            relatedToId: a.id,
                            isMyAnnotation: false,
                            platform: "related",
                            displayOffset: a.displayOffset + i,
                            displayOffsetEnd: a.displayOffsetEnd + i,
                        })) || []),
                    ])
                    .filter(
                        (a) => a.focused || a.platform === "related" || (a.isMyAnnotation && a.text)
                    )
            );
        }

        // use large grouping margin to display every annotation properly
        const groupedAnnotations = groupAnnotations(visibleAnnotations, 75);
        setGroupedAnnotations(groupedAnnotations);
    }, [
        storeAnnotations,
        focusedAnnotationId,
        displayOffsets,
        displayOffsetEnds,
        personalAnnotationsEnabled,
        relatedPerAnnotation,
    ]);

    return (
        // @ts-ignore
        <ReplicacheContext.Provider value={rep}>
            <SidebarContext.Provider value={{ userInfo }}>
                {/* x margin to show slight shadow (iframe allows no overflow) */}
                <div className="app font-text mx-2 text-stone-800">
                    <AnnotationsList
                        groupedAnnotations={groupedAnnotations}
                        unfocusAnnotation={() => setFocusedAnnotationId(null)}
                        fetchRelatedLater={fetchRelatedLater}
                    />
                </div>
            </SidebarContext.Provider>
        </ReplicacheContext.Provider>
    );
}
