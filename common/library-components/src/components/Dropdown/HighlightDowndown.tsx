import React from "react";
import { useContext } from "react";
import { copyTextToClipboard, deleteAnnotationVectors } from "../../common";

import { ReplicacheContext } from "../../store";
import { Annotation, Article } from "../../store/_schema";
import { ModalStateContext } from "../Modal/context";
import { Dropdown, DropdownItem } from "./Dropdown";

export function HighlightDropdown({
    annotation,
    article,
    open,
    setOpen,
    small,
}: {
    annotation: Annotation;
    article: Article | undefined;
    open: boolean;
    setOpen: (open: boolean) => void;
    small?: boolean;
}) {
    const { userInfo, reportEvent } = useContext(ModalStateContext);
    const rep = useContext(ReplicacheContext);

    // async function toggleFavorite(e) {
    //     e.stopPropagation();
    //     await rep?.mutate.updateAnnotation({
    //         id: annotation.id,
    //         is_favorite: !annotation.is_favorite,
    //     });
    //     reportEvent("toggleAnnotationFavorite", {
    //         newState: !annotation.is_favorite,
    //     });
    // }

    async function deleteAnnotation() {
        await rep?.mutate.deleteAnnotation(annotation.id);

        if (userInfo?.aiEnabled) {
            await deleteAnnotationVectors(userInfo.id, undefined, annotation.id);
        }

        reportEvent("deleteAnnotation");
    }

    // async function toggleQueued(e) {
    //     // use articleAddMoveToQueue for reading progress handling
    //     await rep?.mutate.articleAddMoveToQueue({
    //         articleId: article!.id,
    //         isQueued: !article!.is_queued,
    //         // add to front of queue
    //         articleIdBeforeNewPosition: null,
    //         articleIdAfterNewPosition: null,
    //         sortPosition: "queue_sort_position",
    //     });
    //     if (!article!.is_queued) {
    //         reportEvent("addArticleToQueue", { source: "dropdown" });
    //     }
    // }

    function copyText() {
        copyTextToClipboard(`"${annotation.quote_text}"`);
    }

    function searchText() {}

    return (
        <Dropdown open={open} setOpen={setOpen} small={small}>
            {/* {article && (
                <DropdownItem
                    title={article.is_queued ? "De-queue article" : "Queue article"}
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
            )} */}

            {/* <DropdownItem
                title="Search"
                svg={
                    <svg className="h-4 w-4" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M504.1 471l-134-134C399.1 301.5 415.1 256.8 415.1 208c0-114.9-93.13-208-208-208S-.0002 93.13-.0002 208S93.12 416 207.1 416c48.79 0 93.55-16.91 129-45.04l134 134C475.7 509.7 481.9 512 488 512s12.28-2.344 16.97-7.031C514.3 495.6 514.3 480.4 504.1 471zM48 208c0-88.22 71.78-160 160-160s160 71.78 160 160s-71.78 160-160 160S48 296.2 48 208z"
                        />
                    </svg>
                }
                onSelect={searchText}
                top
            /> */}

            <DropdownItem
                title="Copy"
                svg={
                    <svg className="h-4 w-4" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M502.6 70.63l-61.25-61.25C435.4 3.371 427.2 0 418.7 0H255.1c-35.35 0-64 28.66-64 64l.0195 256C192 355.4 220.7 384 256 384h192c35.2 0 64-28.8 64-64V93.25C512 84.77 508.6 76.63 502.6 70.63zM464 320c0 8.836-7.164 16-16 16H255.1c-8.838 0-16-7.164-16-16L239.1 64.13c0-8.836 7.164-16 16-16h128L384 96c0 17.67 14.33 32 32 32h47.1V320zM272 448c0 8.836-7.164 16-16 16H63.1c-8.838 0-16-7.164-16-16L47.98 192.1c0-8.836 7.164-16 16-16H160V128H63.99c-35.35 0-64 28.65-64 64l.0098 256C.002 483.3 28.66 512 64 512h192c35.2 0 64-28.8 64-64v-32h-47.1L272 448z"
                        />
                    </svg>
                }
                onSelect={copyText}
                top
            />

            <DropdownItem
                title="Delete"
                svg={
                    <svg className="h-4 w-4" viewBox="0 0 576 512">
                        <path
                            fill="currentColor"
                            d="M424 80C437.3 80 448 90.75 448 104C448 117.3 437.3 128 424 128H412.4L388.4 452.7C385.9 486.1 358.1 512 324.6 512H123.4C89.92 512 62.09 486.1 59.61 452.7L35.56 128H24C10.75 128 0 117.3 0 104C0 90.75 10.75 80 24 80H93.82L130.5 24.94C140.9 9.357 158.4 0 177.1 0H270.9C289.6 0 307.1 9.358 317.5 24.94L354.2 80H424zM177.1 48C174.5 48 171.1 49.34 170.5 51.56L151.5 80H296.5L277.5 51.56C276 49.34 273.5 48 270.9 48H177.1zM364.3 128H83.69L107.5 449.2C108.1 457.5 115.1 464 123.4 464H324.6C332.9 464 339.9 457.5 340.5 449.2L364.3 128z"
                        />
                    </svg>
                }
                onSelect={deleteAnnotation}
                bottom
            />
        </Dropdown>
    );
}
