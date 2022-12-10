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

    return <div>12</div>;
}
