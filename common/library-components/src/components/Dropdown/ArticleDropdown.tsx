import React from "react";
import clsx from "clsx";
import { useContext } from "react";

import { ReplicacheContext } from "../../store";
import { deleteAnnotationVectors, reportBrokenPage } from "../../common/api";
import { Article, readingProgressFullClamp } from "../../store";
import { Dropdown, DropdownItem } from "./Dropdown";
import { ModalStateContext } from "../Modal/context";

export function ArticleDropdown({
    article,
    open,
    setOpen,
    small,
}: {
    article: Article;
    open: boolean;
    setOpen: (open: boolean) => void;
    small?: boolean;
}) {
    const { userInfo, reportEvent } = useContext(ModalStateContext);
    const rep = useContext(ReplicacheContext);

    // async function toggleFavorite(e) {
    //     e.stopPropagation();
    //     await rep?.mutate.articleSetFavorite({
    //         id: article.id,
    //         is_favorite: !article.is_favorite,
    //     });
    //     reportEvent("toggleArticleFavorite", {
    //         newState: !article.is_favorite,
    //     });
    // }

    async function toggleQueued(e) {
        // use articleAddMoveToQueue for reading progress handling
        await rep?.mutate.articleAddMoveToQueue({
            articleId: article.id,
            isQueued: !article.is_queued,
            // add to front of queue
            articleIdBeforeNewPosition: null,
            articleIdAfterNewPosition: null,
            sortPosition: "queue_sort_position",
        });
        if (!article.is_queued) {
            reportEvent("addArticleToQueue", { source: "dropdown" });
        }
    }

    const completed = article.reading_progress > readingProgressFullClamp;
    function toggleCompleted() {
        const newProgress = completed ? 0 : 1;
        rep?.mutate.updateArticleReadingProgress({
            articleId: article.id,
            readingProgress: newProgress,
        });
        if (newProgress === 1) {
            reportEvent("completeArticle", { source: "dropdown" });
        }
    }

    async function deleteArticle() {
        await rep?.mutate.deleteArticle(article.id);

        if (userInfo?.aiEnabled) {
            await deleteAnnotationVectors(userInfo.id, article.id);
        }

        reportEvent("deleteArticle");
    }
    async function reportPage() {
        await reportBrokenPage(article.url);
        reportEvent("reportArticle");
    }

    return (
        <Dropdown open={open} setOpen={setOpen} small={small}>
            {/* <DropdownItem
                // padding: "    "
                title={isFavorite ? "Unfavorite" : "Favorite"}
                svg={
                    <svg
                        viewBox="0 0 576 512"
                        className="dropdown-elem -mt-0.5 mr-1.5 inline-block w-4"
                    >
                        {isFavorite ? (
                            <path
                                fill="currentColor"
                                d="M381.2 150.3L524.9 171.5C536.8 173.2 546.8 181.6 550.6 193.1C554.4 204.7 551.3 217.3 542.7 225.9L438.5 328.1L463.1 474.7C465.1 486.7 460.2 498.9 450.2 506C440.3 513.1 427.2 514 416.5 508.3L288.1 439.8L159.8 508.3C149 514 135.9 513.1 126 506C116.1 498.9 111.1 486.7 113.2 474.7L137.8 328.1L33.58 225.9C24.97 217.3 21.91 204.7 25.69 193.1C29.46 181.6 39.43 173.2 51.42 171.5L195 150.3L259.4 17.97C264.7 6.954 275.9-.0391 288.1-.0391C300.4-.0391 311.6 6.954 316.9 17.97L381.2 150.3z"
                            />
                        ) : (
                            <path
                                fill="currentColor"
                                d="M287.9 0C297.1 0 305.5 5.25 309.5 13.52L378.1 154.8L531.4 177.5C540.4 178.8 547.8 185.1 550.7 193.7C553.5 202.4 551.2 211.9 544.8 218.2L433.6 328.4L459.9 483.9C461.4 492.9 457.7 502.1 450.2 507.4C442.8 512.7 432.1 513.4 424.9 509.1L287.9 435.9L150.1 509.1C142.9 513.4 133.1 512.7 125.6 507.4C118.2 502.1 114.5 492.9 115.1 483.9L142.2 328.4L31.11 218.2C24.65 211.9 22.36 202.4 25.2 193.7C28.03 185.1 35.5 178.8 44.49 177.5L197.7 154.8L266.3 13.52C270.4 5.249 278.7 0 287.9 0L287.9 0zM287.9 78.95L235.4 187.2C231.9 194.3 225.1 199.3 217.3 200.5L98.98 217.9L184.9 303C190.4 308.5 192.9 316.4 191.6 324.1L171.4 443.7L276.6 387.5C283.7 383.7 292.2 383.7 299.2 387.5L404.4 443.7L384.2 324.1C382.9 316.4 385.5 308.5 391 303L476.9 217.9L358.6 200.5C350.7 199.3 343.9 194.3 340.5 187.2L287.9 78.95z"
                            />
                        )}
                    </svg>
                }
                onSelect={toggleFavorite}
                top
            /> */}

            <DropdownItem
                title={article.is_queued ? "De-queue" : "Queue"}
                svg={
                    <svg className="mr-1.5 inline-block h-4 w-4" viewBox="0 0 640 512">
                        <path
                            fill="currentColor"
                            d="M443.5 17.94C409.8 5.608 375.3 0 341.4 0C250.1 0 164.6 41.44 107.1 112.1c-6.752 8.349-2.752 21.07 7.375 24.68C303.1 203.8 447.4 258.3 618.4 319.1c1.75 .623 3.623 .9969 5.5 .9969c8.25 0 15.88-6.355 16-15.08C643 180.7 567.2 62.8 443.5 17.94zM177.1 108.4c42.88-36.51 97.76-58.07 154.5-60.19c-4.5 3.738-36.88 28.41-70.25 90.72L177.1 108.4zM452.6 208.1L307.4 155.4c14.25-25.17 30.63-47.23 48.13-63.8c25.38-23.93 50.13-34.02 67.51-27.66c17.5 6.355 29.75 29.78 33.75 64.42C459.6 152.4 457.9 179.6 452.6 208.1zM497.8 224.4c7.375-34.89 12.13-76.76 4.125-117.9c45.75 38.13 77.13 91.34 86.88 150.9L497.8 224.4zM576 488.1C576 501.3 565.3 512 552 512L23.99 510.4c-13.25 0-24-10.72-24-23.93c0-13.21 10.75-23.93 24-23.93l228 .6892l78.35-214.8l45.06 16.5l-72.38 198.4l248.1 .7516C565.3 464.1 576 474.9 576 488.1z"
                        />
                    </svg>
                }
                onSelect={toggleQueued}
                top
            />

            <DropdownItem
                title={completed ? "Set unread" : "Set read"}
                svg={
                    <svg
                        viewBox="0 0 576 512"
                        className={clsx(
                            "dropdown-elem -mt-0.5 inline-block w-4",
                            completed ? "ml-0.5 mr-1" : "mr-1 ml-0.5"
                        )}
                    >
                        {completed ? (
                            <path
                                fill="currentColor"
                                d="M40 16C53.25 16 64 26.75 64 40v102.1C103.7 75.57 176.3 32.11 256.1 32.11C379.6 32.11 480 132.5 480 256s-100.4 223.9-223.9 223.9c-52.31 0-103.3-18.33-143.5-51.77c-10.19-8.5-11.56-23.62-3.062-33.81c8.5-10.22 23.66-11.56 33.81-3.062C174.9 417.5 214.9 432 256 432c97.03 0 176-78.97 176-176S353 80 256 80c-66.54 0-126.8 38.28-156.5 96H200C213.3 176 224 186.8 224 200S213.3 224 200 224h-160C26.75 224 16 213.3 16 200v-160C16 26.75 26.75 16 40 16z"
                            />
                        ) : (
                            <path
                                fill="currentColor"
                                d="M440.1 103C450.3 112.4 450.3 127.6 440.1 136.1L176.1 400.1C167.6 410.3 152.4 410.3 143 400.1L7.029 264.1C-2.343 255.6-2.343 240.4 7.029 231C16.4 221.7 31.6 221.7 40.97 231L160 350.1L407 103C416.4 93.66 431.6 93.66 440.1 103V103z"
                            />
                        )}
                    </svg>
                }
                onSelect={toggleCompleted}
            />
            <DropdownItem
                title="Delete"
                svg={
                    <svg
                        viewBox="0 0 576 512"
                        className="dropdown-elem relative left-0.5 -mt-0.5 mr-1.5 inline-block w-4"
                    >
                        <path
                            fill="currentColor"
                            d="M424 80C437.3 80 448 90.75 448 104C448 117.3 437.3 128 424 128H412.4L388.4 452.7C385.9 486.1 358.1 512 324.6 512H123.4C89.92 512 62.09 486.1 59.61 452.7L35.56 128H24C10.75 128 0 117.3 0 104C0 90.75 10.75 80 24 80H93.82L130.5 24.94C140.9 9.357 158.4 0 177.1 0H270.9C289.6 0 307.1 9.358 317.5 24.94L354.2 80H424zM177.1 48C174.5 48 171.1 49.34 170.5 51.56L151.5 80H296.5L277.5 51.56C276 49.34 273.5 48 270.9 48H177.1zM364.3 128H83.69L107.5 449.2C108.1 457.5 115.1 464 123.4 464H324.6C332.9 464 339.9 457.5 340.5 449.2L364.3 128z"
                        />
                    </svg>
                }
                onSelect={deleteArticle}
            />
            {/* <DropdownItem
                title="Report"
                svg={
                    <svg
                        viewBox="0 0 576 512"
                        className="dropdown-elem relative left-0.5 -mt-0.5 mr-1.5 inline-block w-4"
                    >
                        <path
                            fill="currentColor"
                            d="M352 96V99.56C352 115.3 339.3 128 323.6 128H188.4C172.7 128 160 115.3 160 99.56V96C160 42.98 202.1 0 256 0C309 0 352 42.98 352 96zM39.03 103C48.4 93.66 63.6 93.66 72.97 103L145.4 175.5C161.3 165.7 179.1 160 200 160H312C332 160 350.7 165.7 366.6 175.5L439 103C448.4 93.66 463.6 93.66 472.1 103C482.3 112.4 482.3 127.6 472.1 136.1L400.5 209.4C410.3 225.3 416 243.1 416 264H488C501.3 264 512 274.7 512 288C512 301.3 501.3 312 488 312H416V320C416 347.2 409.2 372.8 397.2 395.3L472.1 471C482.3 480.4 482.3 495.6 472.1 504.1C463.6 514.3 448.4 514.3 439 504.1L368.2 434.1C339.3 462.5 299.7 480 256 480C212.3 480 172.7 462.5 143.8 434.1L72.97 504.1C63.6 514.3 48.4 514.3 39.03 504.1C29.66 495.6 29.66 480.4 39.03 471L114.8 395.3C102.8 372.8 96 347.2 96 320V312H24C10.75 312 0 301.3 0 288C0 274.7 10.75 264 24 264H96C96 243.1 101.7 225.3 111.5 209.4L39.03 136.1C29.66 127.6 29.66 112.4 39.03 103V103zM144 320C144 373.6 181.7 418.4 232 429.4V280C232 266.7 242.7 256 256 256C269.3 256 280 266.7 280 280V429.4C330.3 418.4 368 373.6 368 320V264C368 233.1 342.9 208 312 208H200C169.1 208 144 233.1 144 264V320z"
                        />
                    </svg>
                }
                onSelect={reportPage}
                bottom
            /> */}
        </Dropdown>
    );
}
