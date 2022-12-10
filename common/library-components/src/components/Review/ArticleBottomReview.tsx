import React, { useContext, useEffect } from "react";
import { Annotation, ReplicacheContext, useSubscribe } from "../../store";

export default function ArticleBottomReview({ articleId }: { articleId: string }) {
    const rep = useContext(ReplicacheContext);

    const annotations: Annotation[] = useSubscribe(
        rep,
        rep?.subscribe.listArticleAnnotations(articleId),
        []
    );
    console.log(annotations);

    return (
        <div className="flex h-20 w-full flex-col gap-4 rounded-lg bg-white p-4 text-stone-800 shadow dark:bg-[#212121] dark:text-[rgb(232,230,227)]">
            12
        </div>
    );
}
