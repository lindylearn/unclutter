import { getUrlHash } from "@unclutter/library-components/dist/common";
import ArticleBottomReview from "@unclutter/library-components/dist/components/Review/ArticleBottomReview";
import { useState } from "react";

export default function ReviewTestTab({}) {
    const [url, setUrl] = useState<string>(
        "https://thoughtcatalog.com/ryan-holiday/2013/08/how-and-why-to-keep-a-commonplace-book/"
    );

    return (
        <div className="mx-auto w-[780px]">
            <div className="flex h-52 w-full items-start rounded-[10px] bg-[rgb(33,33,33)]">
                <input
                    className="m-5 w-full rounded-lg bg-gray-100 px-3 py-1 outline-none dark:bg-stone-700"
                    placeholder="URL"
                    value={url}
                    onChange={(e) => {
                        setUrl(e.target.value);
                    }}
                />
            </div>
            <div className="mt-[8px]">
                <ArticleBottomReview articleId={getUrlHash(url)} />
            </div>
        </div>
    );
}
