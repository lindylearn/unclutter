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
import { ArticlePreview } from "../Article/ArticlePreview";
import { Article, ReplicacheContext } from "../../store";
import { reportEventPosthog } from "../../common";

export const CustomDraggableContext = createContext<{
    activeArticle: Article | null;
    activeListId: string | null;
    articleLists?: { [listId: string]: Article[] };
} | null>(null);

export default function DraggableContext({
    articleLists,
    children,
    reportEvent = reportEventPosthog,
}: {
    articleLists?: { [listId: string]: Article[] };
    children: ReactNode;
    reportEvent?: (event: string, properties?: any) => void;
}) {
    const rep = useContext(ReplicacheContext);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 15 } }),
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
            const article = articleLists[sourceList].find(
                (a) => a.id === active.id
            );
            setActiveArticle(article || null);
        }
    }
    // move articles between lists
    function handleDragOver({ active, over }: DragOverEvent) {
        if (!articleLists || !over || !activeArticle || !activeListId) {
            return;
        }

        const sourceList = Object.keys(articleLists!).find((listId) =>
            articleLists[listId].some((a) => a.id === active.id)
        );
        const targetList = Object.keys(articleLists!).find((listId) =>
            articleLists[listId].some((a) => a.id === over.id)
        );
        if (sourceList && targetList && sourceList !== targetList) {
            console.log(`move group ${sourceList} -> ${targetList}`);

            const targetIndex = articleLists[targetList].findIndex(
                (a) => a.id === over.id
            );

            articleLists[sourceList] = articleLists[sourceList].filter(
                (a) => a.id !== activeArticle.id
            );
            articleLists[targetList] = articleLists[targetList]
                .slice(0, targetIndex)
                .concat([activeArticle])
                .concat(articleLists[targetList].slice(targetIndex));
            setActiveListId(targetList);
        }
    }
    // change position within target list
    function handleDragEnd({ active, over }: DragEndEvent) {
        if (!over || !articleLists || !activeListId) {
            return;
        }

        if (active.id !== over.id) {
            const oldIndex = articleLists[activeListId].findIndex(
                (a) => a.id === active.id
            );
            const newIndex = articleLists[activeListId].findIndex(
                (a) => a.id === over.id
            );
            // console.log(`move position ${oldIndex} -> ${newIndex}`);

            // update cache immediately (using unshifted index)
            articleLists[activeListId] = arrayMove(
                articleLists[activeListId],
                oldIndex,
                newIndex
            );

            // // mutate replicache
            // // moving an article to the right shifts successors one index to the left
            // const newIndexShifted = oldIndex < newIndex ? newIndex + 1 : newIndex;
            // const beforeNewArticle = articlesCache[newIndexShifted - 1];
            // const afterNewArticle = articlesCache[newIndexShifted];
            // rep?.mutate.moveArticlePosition({
            //     articleId: active.id,
            //     articleIdBeforeNewPosition: beforeNewArticle?.id || null,
            //     articleIdAfterNewPosition: afterNewArticle?.id || null,
            //     sortPosition,
            // });
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
                            <ArticlePreview
                                listState="dragging"
                                article={activeArticle}
                                small
                            />
                        )}
                    </DragOverlay>,
                    document.body
                )}
            </CustomDraggableContext.Provider>
        </DndContext>
    );
}
