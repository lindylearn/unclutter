import React, { useContext, useEffect, useState } from "react";
import ky from "ky";
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
    const [related, setRelated] = useState<Annotation[]>();
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

        Promise.all(
            annotations.slice(0, 3).map((a) =>
                ky
                    .post("https://assistant-two.vercel.app/api/query", {
                        json: {
                            query: a.quote_text,
                        },
                    })
                    .json()
                    .then((related: any[]) =>
                        related
                            .filter((r) => r.score >= 0.5)
                            .sort((a, b) => b.score - a.score)
                            .map(
                                (r) =>
                                    ({
                                        id: r.id,
                                        quote_text: r.metadata.text,
                                    } as Annotation)
                            )
                    )
            )
        ).then((lists) => {
            const related = lists.flat();

            const seen = new Set();
            const deduped = related.filter((r) => {
                if (seen.has(r.id)) {
                    return false;
                }
                seen.add(r.id);
                return true;
            });

            setRelated(deduped);
        });
    }, [annotations]);

    const darkModeEnabled = true;

    return (
        <div className="mx-5 flex flex-col gap-4 text-stone-800 dark:text-[rgb(232,230,227)]">
            <div className="relative mx-auto flex w-[780px] flex-col gap-4 overflow-hidden rounded-lg bg-white shadow dark:bg-[#212121]">
                <ReviewChart />
            </div>

            <div className="flex w-screen flex-col gap-4">
                <h1 className="font-title flex items-center gap-2 text-base font-medium">
                    <svg viewBox="0 0 512 512" className="h-4 w-5">
                        <path
                            fill="currentColor"
                            d="M320 62.06L362.7 19.32C387.7-5.678 428.3-5.678 453.3 19.32L492.7 58.75C517.7 83.74 517.7 124.3 492.7 149.3L229.5 412.5C181.5 460.5 120.3 493.2 53.7 506.5L28.71 511.5C20.84 513.1 12.7 510.6 7.03 504.1C1.356 499.3-1.107 491.2 .4662 483.3L5.465 458.3C18.78 391.7 51.52 330.5 99.54 282.5L286.1 96L272.1 82.91C263.6 73.54 248.4 73.54 239 82.91L136.1 184.1C127.6 194.3 112.4 194.3 103 184.1C93.66 175.6 93.66 160.4 103 151L205.1 48.97C233.2 20.85 278.8 20.85 306.9 48.97L320 62.06zM320 129.9L133.5 316.5C94.71 355.2 67.52 403.1 54.85 457.2C108 444.5 156.8 417.3 195.5 378.5L382.1 192L320 129.9z"
                        />
                    </svg>
                    {annotations.length} new notes
                </h1>
                {annotationGroups?.map((group, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4">
                        {group?.slice(0, 4)?.map((annotation) => (
                            <Highlight
                                key={annotation.id}
                                annotation={annotation}
                                article={article}
                                isCurrentArticle={true}
                                darkModeEnabled={darkModeEnabled}
                                // reportEvent={reportEvent}
                            />
                        ))}
                    </div>
                ))}

                <h1 className="font-title flex items-center gap-2 text-base font-medium">
                    <svg className="h-4 w-5" viewBox="0 0 640 512">
                        <path
                            fill="currentColor"
                            d="M288 64C288 80.85 281.5 96.18 270.8 107.6L297.7 165.2C309.9 161.8 322.7 160 336 160C374.1 160 410.4 175.5 436.3 200.7L513.9 143.7C512.7 138.7 512 133.4 512 128C512 92.65 540.7 64 576 64C611.3 64 640 92.65 640 128C640 163.3 611.3 192 576 192C563.7 192 552.1 188.5 542.3 182.4L464.7 239.4C474.5 258.8 480 280.8 480 304C480 322.5 476.5 340.2 470.1 356.5L537.5 396.9C548.2 388.8 561.5 384 576 384C611.3 384 640 412.7 640 448C640 483.3 611.3 512 576 512C540.7 512 512 483.3 512 448C512 444.6 512.3 441.3 512.8 438.1L445.4 397.6C418.1 428.5 379.8 448 336 448C264.6 448 205.4 396.1 193.1 328H123.3C113.9 351.5 90.86 368 64 368C28.65 368 0 339.3 0 304C0 268.7 28.65 240 64 240C90.86 240 113.9 256.5 123.3 280H193.1C200.6 240.9 222.9 207.1 254.2 185.5L227.3 127.9C226.2 127.1 225.1 128 224 128C188.7 128 160 99.35 160 64C160 28.65 188.7 0 224 0C259.3 0 288 28.65 288 64V64zM336 400C389 400 432 357 432 304C432 250.1 389 208 336 208C282.1 208 240 250.1 240 304C240 357 282.1 400 336 400z"
                        />
                    </svg>
                    {related?.length} related notes
                </h1>
                <div className="grid grid-cols-4 gap-4">
                    {related?.slice(0, 4)?.map((annotation) => (
                        <Highlight
                            key={annotation.id}
                            annotation={annotation}
                            article={article}
                            isCurrentArticle={true}
                            darkModeEnabled={darkModeEnabled}
                            // reportEvent={reportEvent}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
