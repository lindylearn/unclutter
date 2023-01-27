import React from "react";
import { ArticlePreview } from "../ArticlePreview";

export function StaticArticleList({
    articles,
    disableFavoriteShadow = false,
    small = true,
    paddingElements = 0,
}) {
    return (
        <div className="flex flex-wrap gap-3">
            {articles.map((article, listIndex) => {
                return (
                    <ArticlePreview
                        key={article.id}
                        listState={"static"}
                        article={article}
                        listIndex={listIndex}
                        disableFavoriteShadow={disableFavoriteShadow}
                        small={small}
                        disableDropdown={true}
                    />
                );
            })}
            {Array(paddingElements)
                .fill(0)
                .map((_, index) => (
                    <div key={index} className="h-52 w-44" />
                ))}
        </div>
    );
}
