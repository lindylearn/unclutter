import { ReplicacheProxy } from "@unclutter/library-components/dist/common/messaging";
import ArticleBottomReview from "@unclutter/library-components/dist/components/Review/ArticleBottomReview";
import { ReplicacheContext } from "@unclutter/library-components/dist/store/replicache";
import React, { useMemo } from "react";

export default function App({ articleId }) {
    const rep = useMemo<ReplicacheProxy>(() => new ReplicacheProxy(), []);

    return (
        <div className="bottom-container font-text relative mt-4">
            {/* @ts-ignore */}
            <ReplicacheContext.Provider value={rep}>
                <ArticleBottomReview articleId={articleId} />
            </ReplicacheContext.Provider>
        </div>
    );
}
