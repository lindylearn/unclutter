import React, { useContext, useEffect, useState } from "react";
import { Annotation, Article, ReplicacheContext, useSubscribe } from "../../store";
import { ArticleActivityCalendar } from "../Charts";
import { BigNumber, ResourceIcon } from "../Modal";

export default function ArticleBottomReview({
    articleId,
    darkModeEnabled,
}: {
    articleId: string;
    darkModeEnabled: boolean;
}) {
    const rep = useContext(ReplicacheContext);

    const annotations: Annotation[] = useSubscribe(
        rep,
        rep?.subscribe.listArticleAnnotations(articleId),
        []
    );

    const [allArticles, setAllArticles] = useState<Article[]>();
    const [allAnnotations, setAllAnnotations] = useState<Annotation[]>();
    useEffect(() => {
        if (!rep) {
            return;
        }
        rep.query.listRecentArticles().then(setAllArticles);
        rep.query.listAnnotations().then(setAllAnnotations);
    }, [rep]);

    return (
        <div className="bottom-review flex flex-col gap-[8px] text-stone-800 dark:text-[rgb(232,230,227)]">
            <CardContainer>
                <div className="grid grid-cols-4 gap-4 p-4">
                    <BigNumber
                        value={1}
                        tag={`saved article`}
                        icon={<ResourceIcon type="articles_completed" large />}
                    />
                    <BigNumber
                        value={annotations.length}
                        tag={`saved highlights`}
                        icon={<ResourceIcon type="highlights" large />}
                    />
                    <BigNumber
                        value={annotations.length * 2}
                        tag={`connected ideas`}
                        icon={<ResourceIcon type="links" large />}
                    />
                </div>
            </CardContainer>

            <CardContainer>
                <div className="p-4">
                    <ArticleActivityCalendar
                        articles={allArticles}
                        darkModeEnabled={darkModeEnabled}
                        // reportEvent={reportEvent}
                    />
                </div>
            </CardContainer>
        </div>
    );
}

function CardContainer({ children }) {
    return (
        <div className="relative mx-auto w-[780px] gap-4 overflow-hidden rounded-lg bg-white shadow dark:bg-[#212121]">
            {children}
        </div>
    );
}
