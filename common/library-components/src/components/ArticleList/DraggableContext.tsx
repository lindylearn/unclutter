import React, { createContext, ReactNode, useContext, useState } from "react";
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import { DragOverlay } from "@dnd-kit/core";
import { ArticlePreview } from "../ArticlePreview";
import {
    Article,
    ArticleSortPosition,
    readingProgressFullClamp,
    ReplicacheContext,
} from "../../store";
import { getDomain } from "../../common";

export type ArticleListsCache = { [listId: string]: Article[] };
export const CustomDraggableContext = createContext<{
    activeArticle: Article | null;
    activeListId: string | null;
    articleLists?: ArticleListsCache;
} | null>(null);

export function DraggableContext({
    articleLists,
    setArticleLists,
    children,
    reportEvent = () => {},
}: {
    articleLists?: ArticleListsCache;
    setArticleLists: (articleLists: ArticleListsCache) => void;
    children: ReactNode;
    reportEvent?: (event: string, properties?: any) => void;
}) {
    const rep = useContext(ReplicacheContext);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // set active (dragging) article for drag overlay
    const [activeListId, setActiveListId] = useState<string | null>(null);
    const [activeArticle, setActiveArticle] = useState<Article | null>(null);
    function handleDragStart({ active }: DragStartEvent) {
        if (!active.data.current || !articleLists) {
            return;
        }

        const sourceList = Object.keys(articleLists!).find((listId) =>
            articleLists[listId].some((a) => a.id === active.id)
        );
        setActiveListId(sourceList || null);
        if (sourceList) {
            const article = articleLists[sourceList].find((a) => a.id === active.id);
            setActiveArticle(article || null);
        }
    }
    // move articles between lists
    function handleDragOver({ active, over }: DragOverEvent) {
        if (!articleLists || !over || !activeArticle) {
            return;
        }

        const sourceList = Object.keys(articleLists!).find((listId) =>
            articleLists[listId].some((a) => a.id === active.id)
        );
        const targetList = !over.data.current
            ? (over.id as string) // empty container
            : Object.keys(articleLists!).find((listId) =>
                  articleLists[listId].some((a) => a.id === over.id)
              );
        if (targetList && sourceList !== targetList) {
            if (!(sourceList === "queue" || targetList === "queue" || sourceList === "feed")) {
                // only allow specific move ops
                return;
            }
            if (
                // topic
                (targetList.endsWith("_") && activeArticle.topic_id !== targetList) ||
                // domain
                (targetList.includes(".") && getDomain(activeArticle.url) !== targetList) ||
                // new articles row
                (targetList === "new" && !activeArticle.is_new)
            ) {
                // attempted move into non-matching topic or domain group

                if (sourceList) {
                    // prepare article delete
                    articleLists[sourceList] = articleLists[sourceList].filter(
                        (a) => a.id !== activeArticle.id
                    );
                    setActiveListId(null);
                }

                return;
            }
            // console.log(`move group ${sourceList} -> ${targetList}`);

            const targetArticles = articleLists[targetList];
            const targetIndex = targetArticles.findIndex((a) => a.id === over.id);

            // list positions for remote update
            let articleIdBeforeNewPosition: string | null;
            let articleIdAfterNewPosition: string | null;
            if (targetIndex !== -1) {
                // assume is first entry intitially, so move to right
                articleIdBeforeNewPosition = targetArticles[targetIndex]?.id;
                articleIdAfterNewPosition = targetArticles[targetIndex + 1]?.id;
            } else {
                articleIdBeforeNewPosition = targetArticles[targetArticles.length - 1]?.id || null;
                articleIdAfterNewPosition = null;
            }

            if (activeArticle.is_temporary) {
                // add to library
                rep?.mutate.articleAddMoveToLibrary({
                    temporaryArticle: activeArticle,
                    articleIdBeforeNewPosition,
                    articleIdAfterNewPosition,
                    sortPosition: "domain_sort_position",
                });
            } else {
                // toggle reading queue status
                rep?.mutate.articleAddMoveToQueue({
                    articleId: activeArticle.id,
                    isQueued: targetList === "queue",
                    articleIdBeforeNewPosition,
                    articleIdAfterNewPosition,
                    sortPosition: "queue_sort_position",
                });
            }

            // immediate local update
            if (sourceList) {
                articleLists[sourceList] = articleLists[sourceList].filter(
                    (a) => a.id !== activeArticle.id
                );
            }
            if (targetIndex !== -1) {
                articleLists[targetList] = targetArticles
                    .slice(0, targetIndex)
                    .concat([activeArticle])
                    .concat(targetArticles.slice(targetIndex));
            } else {
                articleLists[targetList] = targetArticles.concat([activeArticle]);
            }

            setActiveListId(targetList);

            if (targetList === "queue") {
                reportEvent("addArticleToQueue");
            }
        }
    }

    function handleDragEnd({ active, over }: DragEndEvent) {
        if (!over || !articleLists) {
            return;
        }
        if (!activeListId) {
            // remove from queue
            rep?.mutate.updateArticle({
                id: active.id as string,
                is_queued: false,
            });
        } else if (active.id !== over.id) {
            // change position within list
            const oldIndex = articleLists[activeListId].findIndex((a) => a.id === active.id);
            const newIndex = articleLists[activeListId].findIndex((a) => a.id === over.id);
            // console.log(`move position ${oldIndex} -> ${newIndex}`);

            // check which sort order to modify
            let sortKey: ArticleSortPosition;
            if (activeListId === "list") {
                sortKey = "recency_sort_position";
            } else if (activeListId === "queue") {
                sortKey = "queue_sort_position";
            } else if (activeListId === "favorites") {
                sortKey = "favorites_sort_position";
            } else if (activeListId.endsWith("_")) {
                sortKey = "topic_sort_position";
            } else if (activeListId.includes(".")) {
                sortKey = "domain_sort_position";
            } else {
                console.error(
                    `Could not determine sort position to reorder for list ${activeListId}`
                );
                sortKey = "recency_sort_position";
            }

            // mutate replicache
            // moving an article to the right shifts successors one index to the left
            const newIndexShifted = oldIndex < newIndex ? newIndex + 1 : newIndex;
            const beforeNewArticle = articleLists[activeListId][newIndexShifted - 1];
            const afterNewArticle = articleLists[activeListId][newIndexShifted];
            rep?.mutate.moveArticlePosition({
                articleId: active.id as string,
                articleIdBeforeNewPosition: beforeNewArticle?.id || null,
                articleIdAfterNewPosition: afterNewArticle?.id || null,
                sortPosition: sortKey,
            });

            // update cache immediately (using unshifted index)
            // NOTE: moving this before the index access above breaks the sorting
            articleLists[activeListId] = arrayMove(articleLists[activeListId], oldIndex, newIndex);

            // update parent articleList once drag done (e.g. updates list counts)
            setArticleLists({ ...articleLists });
        }

        setActiveArticle(null);
        setActiveListId(null);

        reportEvent("reorderArticles");
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <CustomDraggableContext.Provider
                value={{
                    activeArticle: activeArticle,
                    activeListId,
                    articleLists,
                }}
            >
                {children}
                {/* render inside portal to handle parent margins */}
                {createPortal(
                    <DragOverlay
                        dropAnimation={{
                            duration: 300,
                            easing: "cubic-bezier(0.65, 0, 0.35, 1)",
                        }}
                        className="article-drag-overlay"
                    >
                        {activeArticle && (
                            <ArticlePreview listState="dragging" article={activeArticle} small />
                        )}
                    </DragOverlay>,
                    document.body
                )}
            </CustomDraggableContext.Provider>
        </DndContext>
    );
}
