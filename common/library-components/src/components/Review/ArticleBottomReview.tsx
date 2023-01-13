import React, { useContext, useEffect, useState } from "react";
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

    function openLibrary(initialTab: string) {
        window.top?.postMessage(
            {
                event: "showModal",
                initialTab,
            },
            "*"
        );
    }

    const allAnnotationsCount =
        allAnnotations && articleAnnotations && allAnnotations?.length + articleAnnotations?.length;

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
                        onClick={() => openLibrary("stats")}
                    />
                    <BigNumber
                        value={allAnnotationsCount}
                        diff={articleAnnotations?.length}
                        tag={`saved highlights`}
                        icon={<ResourceIcon type="highlights" large />}
                        colorOverride={getActivityColor(1, darkModeEnabled)}
                        onClick={() => openLibrary("highlights")}
                    />
                    {/* <BigNumber
                        value={allAnnotationsCount && allAnnotationsCount * 2}
                        diff={articleAnnotations && articleAnnotations?.length * 2}
                        tag={`connected ideas`}
                        icon={<ResourceIcon type="links" large />}
                    /> */}
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

function CardContainer({ children }) {
    return (
        <div className="relative mx-auto flex w-[var(--lindy-pagewidth)] flex-col gap-4 overflow-hidden rounded-lg bg-white p-4 shadow dark:bg-[#212121]">
            {children}
        </div>
    );
}
