import { reportEventContentScript } from "@unclutter/library-components/dist/common/messaging";
import { ReplicacheProxy } from "@unclutter/library-components/dist/common/replicache";
import ArticleBottomReview from "@unclutter/library-components/dist/components/Review/ArticleBottomReview";
import SignupBottomMessage from "@unclutter/library-components/dist/components/Review/SignupBottomMessage";
import { ReplicacheContext } from "@unclutter/library-components/dist/store/replicache";
import React, { useEffect, useMemo } from "react";

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

    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            console.log(`Review container resized to ${document.body.scrollHeight}px`);
            window.top?.postMessage(
                { event: "bottomIframeSetHeight", height: `${document.body.scrollHeight}px` },
                "*"
            );
        });
        resizeObserver.observe(document.body);

        return () => resizeObserver.disconnect();
    }, []);

    return (
        <div className="bottom-container font-text relative pt-2 pb-4">
            {/* @ts-ignore */}
            <ReplicacheContext.Provider value={rep}>
                {type === "review" && (
                    <ArticleBottomReview
                        articleId={articleId}
                        darkModeEnabled={darkModeEnabled === "true"}
                        reportEvent={reportEventContentScript}
                    />
                )}
                {type === "signup" && (
                    <SignupBottomMessage
                        articleId={articleId}
                        darkModeEnabled={darkModeEnabled === "true"}
                        reportEvent={reportEventContentScript}
                    />
                )}
            </ReplicacheContext.Provider>
        </div>
    );
}
