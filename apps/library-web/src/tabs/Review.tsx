import { getUrlHash } from "@unclutter/library-components/dist/common";
import ArticleBottomReview from "@unclutter/library-components/dist/components/Review/ArticleBottomReview";

export default function ReviewTestTab({}) {
    const articleId = getUrlHash(
        "https://boffosocko.com/2022/10/22/the-two-definitions-of-zettelkasten/"
    );

    return (
        <div className="h-screen w-screen p-1">
            <ArticleBottomReview articleId={articleId} />
        </div>
    );
}
