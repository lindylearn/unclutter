import { DraggableArticleList, StaticArticleList } from "../../components";
import {
    Article,
    ArticleBucketMap,
    groupRecentArticles,
    listRecentArticles,
    ReplicacheContext,
} from "../../store";
import React, { useContext, useEffect } from "react";

export default function RecentModalTab({}) {
    const rep = useContext(ReplicacheContext);

    const [articleBuckets, setArticleBuckets] =
        React.useState<ArticleBucketMap>();
    useEffect(() => {
        if (!rep) {
            return;
        }
        const start = new Date();
        start.setDate(start.getDate() - 30);
        rep.query((tx) =>
            groupRecentArticles(tx, start, undefined, null, false)
        ).then(setArticleBuckets);
    }, [rep]);

    return (
        <div className="flex flex-col gap-4">
            {articleBuckets &&
                Object.entries(articleBuckets)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([key, bucket]) => (
                        <div key={key}>
                            <h2 className="mb-3 font-medium">
                                {/* <svg
                                    className="mr-1.5 inline-block w-4 align-sub"
                                    viewBox="0 0 448 512"
                                >
                                    <path
                                        fill="currentColor"
                                        d="M152 64H296V24C296 10.75 306.7 0 320 0C333.3 0 344 10.75 344 24V64H384C419.3 64 448 92.65 448 128V448C448 483.3 419.3 512 384 512H64C28.65 512 0 483.3 0 448V128C0 92.65 28.65 64 64 64H104V24C104 10.75 114.7 0 128 0C141.3 0 152 10.75 152 24V64zM48 448C48 456.8 55.16 464 64 464H384C392.8 464 400 456.8 400 448V192H48V448z"
                                    />
                                </svg> */}
                                {bucket.title}
                            </h2>
                            <StaticArticleList
                                articles={bucket.articles}
                                small
                            />
                        </div>
                    ))}

            {/* {articles && (
                <DraggableArticleList
                    articles={articles}
                    // articlesToShow={articlesPerRow * articleRows}
                    sortPosition="recency_sort_position"
                    // reportEvent={reportEvent}
                />
            )} */}
        </div>
    );
}
