import { ReplicacheProxy } from "@unclutter/library-components/dist/common";
import ArticleBottomReview from "@unclutter/library-components/dist/components/Review/ArticleBottomReview";
import { ReplicacheContext } from "@unclutter/library-components/dist/store";
import React, { useMemo } from "react";

export default function App({ articleId }) {
    const rep = useMemo<ReplicacheProxy>(() => new ReplicacheProxy(), []);

    return (
        <div className="bottom-container font-text relative m-[5px] mt-[8px]">
            {/* // @ts-ignore */}
            <ReplicacheContext.Provider value={rep}>
                <ArticleBottomReview articleId={articleId} />
            </ReplicacheContext.Provider>
        </div>
    );
}
