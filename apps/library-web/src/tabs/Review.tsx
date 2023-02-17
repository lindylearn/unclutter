import { getUrlHash } from "@unclutter/library-components/dist/common";
import ArticleBottomReview from "@unclutter/library-components/dist/components/Review/ArticleBottomReview";
import SignupBottomMessage from "@unclutter/library-components/dist/components/Review/SignupBottomMessage";
import { useState } from "react";

export default function ReviewTestTab({}) {
    const [url, setUrl] = useState<string>(
        "https://stratechery.com/2015/netflix-and-the-conservation-of-attractive-profits"
    );

    return (
        <div className="fixed top-0 left-0 mx-auto h-screen w-screen bg-gray-100">
            <div className="mx-auto flex h-52 w-[780px] items-start rounded-b-[10px] bg-white shadow dark:bg-[rgb(33,33,33)]">
                {/* <input
                    className="m-5 w-full rounded-lg bg-gray-100 px-3 py-1 outline-none dark:bg-stone-700"
                    placeholder="URL"
                    value={url}
                    onChange={(e) => {
                        setUrl(e.target.value);
                    }}
                /> */}
            </div>
            <div
                className="mt-5"
                style={{
                    // @ts-ignore
                    "--lindy-pagewidth": "780px",
                }}
            >
                <ArticleBottomReview articleId={getUrlHash(url)} darkModeEnabled={false} />
                {/* <SignupBottomMessage articleId={getUrlHash(url)} darkModeEnabled={false} /> */}
            </div>
        </div>
    );
}
