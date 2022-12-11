import React, { useContext, useEffect, useState } from "react";
import { Annotation, Article, ReplicacheContext, useSubscribe } from "../../store";
import { Highlight } from "../Highlight";
import { ReviewChart } from "./ReviewChart";

export default function ArticleBottomReview({ articleId }: { articleId: string }) {
    const rep = useContext(ReplicacheContext);

    const [article, setArticle] = useState<Article>();
    useEffect(() => {
        rep?.query.getArticle(articleId).then(setArticle);
    }, [articleId]);

    const annotations: Annotation[] = useSubscribe(
        rep,
        rep?.subscribe.listArticleAnnotations(articleId),
        []
    );
    const [annotationGroups, setAnnotationGroups] = useState<Annotation[][]>();
    useEffect(() => {
        if (!annotations) {
            setAnnotationGroups(undefined);
            return;
        }

        setAnnotationGroups([annotations.sort((a, b) => a.created_at - b.created_at)]);
        // setAnnotationGroups(annotations.map((annotation) => [annotation]));

        // ky.post("/api/group", {
        //     json: {
        //         url,
        //     },
        // })
        //     .json()
        //     .then((highlights: any) => setHighlightGroups(highlights));
    }, [annotations]);

    const darkModeEnabled = true;

    return (
        <div className="mx-5 flex flex-col gap-4 text-stone-800 dark:text-[rgb(232,230,227)]">
            <div className="relative mx-auto flex w-[780px] flex-col gap-4 overflow-hidden rounded-lg bg-white shadow dark:bg-[#212121]">
                <h1 className="font-title absolute top-4 left-4 flex items-center gap-2 text-base font-medium">
                    <svg viewBox="0 0 512 512" className="h-4">
                        <path
                            fill="currentColor"
                            d="M320 62.06L362.7 19.32C387.7-5.678 428.3-5.678 453.3 19.32L492.7 58.75C517.7 83.74 517.7 124.3 492.7 149.3L229.5 412.5C181.5 460.5 120.3 493.2 53.7 506.5L28.71 511.5C20.84 513.1 12.7 510.6 7.03 504.1C1.356 499.3-1.107 491.2 .4662 483.3L5.465 458.3C18.78 391.7 51.52 330.5 99.54 282.5L286.1 96L272.1 82.91C263.6 73.54 248.4 73.54 239 82.91L136.1 184.1C127.6 194.3 112.4 194.3 103 184.1C93.66 175.6 93.66 160.4 103 151L205.1 48.97C233.2 20.85 278.8 20.85 306.9 48.97L320 62.06zM320 129.9L133.5 316.5C94.71 355.2 67.52 403.1 54.85 457.2C108 444.5 156.8 417.3 195.5 378.5L382.1 192L320 129.9z"
                        />
                    </svg>
                    Your highlights
                </h1>

                <ReviewChart />
            </div>

            <div className="flex w-screen flex-col gap-4">
                {annotationGroups?.map((group, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4">
                        {group?.map((annotation) => (
                            <Highlight
                                key={annotation.id}
                                annotation={annotation}
                                article={article}
                                isCurrentArticle={true}
                                darkModeEnabled={darkModeEnabled}
                                // reportEvent={reportEvent}
                            />

                            // <div
                            //     key={annotation.id}
                            //     className="flex w-full max-w-sm shrink-0 flex-col gap-4 rounded-lg bg-white p-4 text-sm shadow dark:bg-[#212121]"
                            // >
                            //     <p className="opacity-70">&quot;{annotation.quote_text}&quot;</p>

                            //     <textarea
                            //         className="h-20 select-none rounded-lg bg-transparent py-1 align-top text-sm placeholder-gray-400 outline-none placeholder:select-none"
                            //         value={annotation.text}
                            //     />
                            // </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
