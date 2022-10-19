import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
    rectSortingStrategy,
    SortableContext,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { useContext } from "react";
import { Article } from "../../store/_schema";
import { ArticlePreview } from "../Article/ArticlePreview";
import clsx from "clsx";
import { CustomDraggableContext } from "./DraggableContext";

export function DraggableArticleList({
    listId,
    disableFavoriteShadow = false,
    small = false,
    articlesToShow,
    centerGrid = false,
    reportEvent = () => {},
}: {
    listId: string;
    disableFavoriteShadow?: boolean;
    small?: boolean;
    articlesToShow?: number;
    centerGrid?: boolean;
    reportEvent?: (event: string, properties?: any) => void;
}) {
    const draggableContext = useContext(CustomDraggableContext);
    const articles: Article[] = draggableContext?.articleLists?.[listId] || [];

    // required to drag into empty container
    const { setNodeRef } = useDroppable({
        id: listId,
    });

    return (
        <SortableContext
            id={listId}
            items={articles}
            strategy={rectSortingStrategy}
        >
            <div
                className={clsx(
                    "article-list animate-fadein flex h-full flex-wrap content-start gap-3",
                    centerGrid ? "justify-center" : ""
                )}
                ref={setNodeRef}
            >
                {articles.slice(0, articlesToShow).map((article, listIndex) => (
                    <SortableItem
                        key={article.id}
                        listState={
                            draggableContext?.activeArticle?.id === article.id
                                ? "active"
                                : "static"
                        }
                        article={article}
                        listIndex={listIndex}
                        disableFavoriteShadow={disableFavoriteShadow}
                        small={small}
                        reportEvent={reportEvent}
                    />
                ))}
                {centerGrid &&
                    !small &&
                    Array(
                        Math.max(
                            0,
                            (articlesToShow || articles.length) -
                                articles.length
                        )
                    )
                        .fill(0)
                        .map((_, index) => (
                            <div key={index} className="h-52 w-44" />
                        ))}
            </div>
        </SortableContext>
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
