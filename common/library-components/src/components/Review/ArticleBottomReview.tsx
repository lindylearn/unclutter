import React, { useContext, useEffect, useMemo, useState } from "react";
import { Annotation, Article, ReplicacheContext, useSubscribe } from "../../store";
import { getActivityColor } from "../Charts";
import { BigNumber, ResourceIcon } from "../Modal";

export default function ArticleBottomReview({
    articleId,
    darkModeEnabled,
}: {
    articleId: string;
    darkModeEnabled: boolean;
}) {
    // subscribe to store data
    const rep = useContext(ReplicacheContext);
    const articleAnnotations: Annotation[] = useSubscribe(
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

    // handle events
    const [relatedCount, setRelatedCount] = useState<number>();
    useEffect(() => {
        window.onmessage = async function ({ data }) {
            if (data.event === "updateRelatedCount") {
                setRelatedCount(data.relatedCount);
            }
        };
    }, []);

    function openLibrary(initialTab: string) {
        window.top?.postMessage(
            {
                event: "showModal",
                initialTab,
            },
            "*"
        );
    }

    const allAnnotationsCount = useMemo(
        () =>
            allAnnotations &&
            articleAnnotations &&
            allAnnotations.filter((a) => a.article_id !== articleId).length +
                articleAnnotations.length,
        [allAnnotations, articleAnnotations]
    );

    return (
        <div className="bottom-review flex flex-col gap-[8px] text-stone-800 dark:text-[rgb(232,230,227)]">
            <CardContainer>
                <div className="relative grid grid-cols-4 gap-4">
                    <BigNumber
                        value={allArticles?.length}
                        diff={1}
                        tag={`saved articles`}
                        icon={<ResourceIcon type="articles" large />}
                        colorOverride={getActivityColor(1, darkModeEnabled)}
                        onClick={() => openLibrary("list")}
                    />
                    <BigNumber
                        value={allAnnotationsCount}
                        diff={articleAnnotations?.length}
                        tag={`saved highlights`}
                        icon={<ResourceIcon type="highlights" large />}
                        colorOverride={getActivityColor(1, darkModeEnabled)}
                        onClick={() => openLibrary("highlights")}
                    />
                    <BigNumber
                        diff={relatedCount}
                        tag={`connected ideas`}
                        icon={<ResourceIcon type="puzzle" large />}
                        colorOverride={getActivityColor(1, darkModeEnabled)}
                    />
                </div>

                {/* <ArticleActivityCalendar
                    articles={allArticles}
                    darkModeEnabled={darkModeEnabled}
                    // reportEvent={reportEvent}
                /> */}
            </CardContainer>
        </div>
    );
}

export function CardContainer({ children }) {
    return (
        <div className="relative mx-auto flex w-[var(--lindy-pagewidth)] flex-col gap-4 overflow-hidden rounded-lg bg-white p-4 shadow dark:bg-[#212121]">
            {children}
        </div>
    );
}
