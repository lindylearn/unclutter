import { ReplicacheProxy } from "@unclutter/library-components/dist/common/replicache";
import ArticleBottomReview from "@unclutter/library-components/dist/components/Review/ArticleBottomReview";
import SignupBottomMessage from "@unclutter/library-components/dist/components/Review/SignupBottomMessage";
import { ReplicacheContext } from "@unclutter/library-components/dist/store/replicache";
import React, { useMemo } from "react";

export default function App({
    articleId,
    darkModeEnabled,
    type,
}: {
    articleId: string;
    darkModeEnabled: string;
    type: string;
}) {
    const rep = useMemo<ReplicacheProxy>(() => new ReplicacheProxy(), []);

    return (
        <div className="bottom-container font-text relative mt-[8px]">
            {/* @ts-ignore */}
            <ReplicacheContext.Provider value={rep}>
                {type === "review" && (
                    <ArticleBottomReview
                        articleId={articleId}
                        darkModeEnabled={darkModeEnabled === "true"}
                    />
                )}
                {type === "signup" && (
                    <SignupBottomMessage
                        articleId={articleId}
                        darkModeEnabled={darkModeEnabled === "true"}
                    />
                )}
            </ReplicacheContext.Provider>
        </div>
    );
}
