import React, { useContext, useEffect, useState } from "react";
import { Annotation, Article, ReplicacheContext, useSubscribe } from "../../store";
import { Highlight } from "../Highlight";

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

    // return (
    //     <div className="flex h-20 w-full flex-col gap-4 rounded-lg bg-white p-4 shadow dark:bg-[#212121]">
    //     </div>
    // );

    const darkModeEnabled = true;

    return (
        <div className="flex flex-col gap-4 text-stone-800 dark:text-[rgb(232,230,227)]">
            <div className="flex w-screen flex-col gap-4">
                {annotationGroups?.map((group, index) => (
                    <div key={index} className="mx-[8px] grid grid-cols-4 gap-[8px]">
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
