import React, { useContext, useEffect, useMemo, useState } from "react";
import { getRandomColor } from "../../common";
import { Annotation, Article, ReplicacheContext, useSubscribe } from "../../store";
import { getActivityColor } from "../Charts";
import { BigNumber, ResourceIcon } from "../Modal";

export default function ArticleBottomReview({
    articleId,
    darkModeEnabled,
    reportEvent = () => {},
}: {
    articleId: string;
    darkModeEnabled: boolean;
    reportEvent?: (event: string, data?: any) => void;
}) {
    // subscribe to store data
    const rep = useContext(ReplicacheContext);
    const articleAnnotations: Annotation[] = useSubscribe(
        rep,
        rep?.subscribe.listArticleAnnotations(articleId),
        []
    );
    // const [allArticles, setAllArticles] = useState<Article[]>();
    // const [allAnnotations, setAllAnnotations] = useState<Annotation[]>();
    // useEffect(() => {
    //     if (!rep) {
    //         return;
    //     }
    //     rep.query.listRecentArticles().then(setAllArticles);
    //     rep.query.listAnnotations().then(setAllAnnotations);
    // }, [rep]);

    // handle events
    // const [relatedCount, setRelatedCount] = useState<number>();
    // useEffect(() => {
    //     window.onmessage = async function ({ data }) {
    //         if (data.event === "updateRelatedCount") {
    //             setRelatedCount(data.relatedCount);
    //         }
    //     };
    // }, []);

    function openLibrary(initialTab: string, initialTagFilter?: string) {
        window.top?.postMessage(
            {
                event: "showModal",
                initialTab,
                initialTagFilter,
            },
            "*"
        );
    }

    // const allAnnotationsCount = useMemo(
    //     () =>
    //         allAnnotations &&
    //         articleAnnotations &&
    //         allAnnotations.filter((a) => a.article_id !== articleId).length +
    //             articleAnnotations.length,
    //     [allAnnotations, articleAnnotations]
    // );

    const [tagCountList, setTagCountList] = useState<[string, number][]>([]);
    useEffect(() => {
        const tagCounts: { [tag: string]: number } = { uncategorized: 0 };
        for (const annotation of articleAnnotations) {
            if (!annotation.tags?.length) {
                tagCounts["uncategorized"]++;
                continue;
            }
            for (const tag of annotation.tags?.slice(0, 1)) {
                if (tagCounts[tag]) {
                    tagCounts[tag]++;
                } else {
                    tagCounts[tag] = 1;
                }
            }
        }

        setTagCountList(Object.entries(tagCounts).sort((a, b) => b[1] - a[1]));
    }, [articleAnnotations]);

    return (
        <div className="bottom-review bottom-content flex flex-col gap-[8px] text-stone-800 dark:text-[rgb(232,230,227)]">
            <CardContainer>
                <div className="relative grid grid-cols-5 gap-4">
                    {tagCountList.map(([tag, count]) => (
                        <BigNumber
                            diff={count}
                            tag={`#${tag}`}
                            colorOverride={getRandomColor(tag)}
                            onClick={() => openLibrary("highlights", tag)}
                        />
                    ))}
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
