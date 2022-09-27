import React from "react";
import {
    closestCenter,
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    rectSortingStrategy,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { useContext, useEffect, useState } from "react";
import { Article } from "../../store/_schema";
import { ArticlePreview } from "../Article/ArticlePreview";
import { ArticleSortPosition, ReplicacheContext } from "../../store";
import clsx from "clsx";
import { reportEventPosthog } from "../../common/metrics";

interface ArticleListProps {
    articles: Article[];
    showTopics?: boolean;
    sortPosition: ArticleSortPosition;
    disableFavoriteShadow?: boolean;
    small?: boolean;
    articlesToShow?: number;
    centerGrid?: boolean;
    reportEvent?: (event: string, properties?: any) => void;
}

export function DraggableArticleList({
    articles,
    showTopics = false,
    sortPosition,
    disableFavoriteShadow = false,
    small = false,
    articlesToShow = articles.length,
    centerGrid = false,
    reportEvent = reportEventPosthog,
}: ArticleListProps) {
    const rep = useContext(ReplicacheContext);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 15 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const [articlesCache, setArticlesCache] = useState<Article[]>([]);
    useEffect(() => {
        setArticlesCache(articles.slice(0, articlesToShow));
    }, [articles, articlesToShow]);

    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    function handleDragStart({ active }) {
        const oldIndex = articlesCache.findIndex(
            (article) => article.id === active.id
        );

        setActiveIndex(oldIndex);
    }
    function handleDragEnd({ active, over }) {
        if (active.id !== over.id) {
            const oldIndex = articles.findIndex(
                (article) => article.id === active.id
            );
            let newIndex = articles.findIndex(
                (article) => article.id === over.id
            );
            // moving an article to the right shifts successors one index to the left
            const newIndexShifted =
                oldIndex < newIndex ? newIndex + 1 : newIndex;

            const beforeNewArticle = articles[newIndexShifted - 1];
            const afterNewArticle = articles[newIndexShifted];

            // mutate replicache
            rep?.mutate.moveArticlePosition({
                articleId: active.id,
                articleIdBeforeNewPosition: beforeNewArticle?.id || null,
                articleIdAfterNewPosition: afterNewArticle?.id || null,
                sortPosition,
            });

            setArticlesCache((items) => {
                // update cache immediately (using unshifted index)
                return arrayMove(items, activeIndex!, newIndex);
            });
        }

        setActiveIndex(null);
        reportEvent("reorderArticles");
    }

    return (
        <div
            className={clsx(
                "flex flex-wrap gap-3",
                centerGrid ? "justify-center" : ""
            )}
        >
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={articlesCache}
                    strategy={rectSortingStrategy}
                >
                    {articlesCache.map((article, listIndex) => (
                        <SortableItem
                            key={article.id}
                            listState={
                                activeIndex === listIndex ? "active" : "static"
                            }
                            article={article}
                            listIndex={listIndex}
                            disableFavoriteShadow={disableFavoriteShadow}
                            reportEvent={reportEvent}
                        />
                    ))}
                    {Array(Math.max(0, articlesToShow - articlesCache.length))
                        .fill(0)
                        .map((_, index) => (
                            <div key={index} className="h-52 w-44" />
                        ))}
                </SortableContext>
                <DragOverlay
                    dropAnimation={{
                        duration: 300,
                        easing: "cubic-bezier(0.65, 0, 0.35, 1)",
                    }}
                    className="article-drag-overlay"
                >
                    {activeIndex !== null && (
                        <ArticlePreview
                            listState="dragging"
                            article={articlesCache[activeIndex]}
                            listIndex={activeIndex}
                            disableFavoriteShadow={disableFavoriteShadow}
                            small={small}
                        />
                    )}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

function SortableItem(props) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: props.article.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <ArticlePreview
            setNodeRef={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            listState={props.listState}
            article={props.article}
            listIndex={props.listIndex}
            disableFavoriteShadow={props.disableFavoriteShadow}
            small={props.small}
            reportEvent={props.reportEvent}
        />
    );
}
