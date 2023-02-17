import clsx from "clsx";
import React, { useContext, useState } from "react";
import {
    getAnnotationColorNew,
    getDomain,
    getRandomLightColor,
    openArticleResilient,
    sendMessage,
} from "../common";
import { Annotation, Article } from "../store";
import { getActivityColor } from "./Charts";
import { HighlightDropdown } from "./Dropdown/HighlightDowndown";
import { ModalVisibilityContext } from "./Modal/context";

export function Highlight({
    annotation,
    article,
    isCurrentArticle,
    darkModeEnabled,
    reportEvent = () => {},
}: {
    annotation: Annotation;
    article: Article | undefined;
    isCurrentArticle: boolean;
    darkModeEnabled: boolean;
    reportEvent?: (event: string, properties?: any) => void;
}) {
    // const rep = useContext(ReplicacheContext);
    const { closeModal } = useContext(ModalVisibilityContext);

    const [dropdownOpen, setDropdownOpen] = useState(false);

    function openHighlight(e) {
        e.preventDefault();
        e.stopPropagation();

        if (isCurrentArticle) {
            closeModal?.();
            sendMessage({ event: "focusAnnotation", annotationId: annotation.id, source: "modal" });
        } else if (article?.url) {
            // open new tab & scroll to highlight
            openArticleResilient(article.url, true, annotation.id);
        }

        reportEvent("openHighlight", { isCurrentArticle });
    }

    const [color, colorDark] = getAnnotationColorNew(annotation);

    return (
        <a
            className="highlight animate-fadein relative flex cursor-pointer select-none flex-col gap-2 overflow-hidden rounded-l-sm rounded-r-md bg-white px-3 py-2 text-sm text-stone-800 shadow transition-transform hover:scale-[99%] dark:bg-neutral-800 dark:text-white"
            href={article?.url}
            onClick={openHighlight}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDropdownOpen(true);
            }}
            style={{
                // background: color,
                borderLeft: `8px solid ${color}`,
            }}
        >
            <HighlightDropdown
                annotation={annotation}
                article={article}
                open={dropdownOpen}
                setOpen={setDropdownOpen}
            />

            <LimitedText
                className={clsx("flex-grow leading-normal")}
                text={annotation.text || annotation.quote_text}
                rows={6}
            />

            {/* <div>
                {annotation.score?.toFixed(2)}
                {annotation.score2?.toFixed(2)}
            </div> */}
            {/* 
            <div className="info-bar flex gap-4 whitespace-nowrap font-medium text-neutral-400 dark:text-neutral-500">
                <div className="flex items-center gap-1">
                    <svg className="h-4 w-4" viewBox="0 0 576 512">
                        <path
                            fill="currentColor"
                            d="M160 256C160 185.3 217.3 128 288 128C358.7 128 416 185.3 416 256C416 326.7 358.7 384 288 384C217.3 384 160 326.7 160 256zM288 336C332.2 336 368 300.2 368 256C368 211.8 332.2 176 288 176C287.3 176 286.7 176 285.1 176C287.3 181.1 288 186.5 288 192C288 227.3 259.3 256 224 256C218.5 256 213.1 255.3 208 253.1C208 254.7 208 255.3 208 255.1C208 300.2 243.8 336 288 336L288 336zM95.42 112.6C142.5 68.84 207.2 32 288 32C368.8 32 433.5 68.84 480.6 112.6C527.4 156 558.7 207.1 573.5 243.7C576.8 251.6 576.8 260.4 573.5 268.3C558.7 304 527.4 355.1 480.6 399.4C433.5 443.2 368.8 480 288 480C207.2 480 142.5 443.2 95.42 399.4C48.62 355.1 17.34 304 2.461 268.3C-.8205 260.4-.8205 251.6 2.461 243.7C17.34 207.1 48.62 156 95.42 112.6V112.6zM288 80C222.8 80 169.2 109.6 128.1 147.7C89.6 183.5 63.02 225.1 49.44 256C63.02 286 89.6 328.5 128.1 364.3C169.2 402.4 222.8 432 288 432C353.2 432 406.8 402.4 447.9 364.3C486.4 328.5 512.1 286 526.6 256C512.1 225.1 486.4 183.5 447.9 147.7C406.8 109.6 353.2 80 288 80V80z"
                        />
                    </svg>
                    2 hours ago
                </div>

                <div className="flex items-center gap-1">
                    <svg className="h-4 w-4" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M373.3 361.2C398.7 374.6 416 401.3 416 432C416 476.2 380.2 512 336 512C291.8 512 255.1 476.2 255.1 432C255.1 420.5 258.4 409.6 262.7 399.8L121.6 276.3C109.5 283.7 95.25 288 80 288C35.82 288 0 252.2 0 208C0 163.8 35.82 128 80 128C104.1 128 127.3 139.4 141.9 157.4L320.2 86.06C320.1 84.06 320 82.04 320 80C320 35.82 355.8 0 400 0C444.2 0 480 35.82 480 80C480 120.8 449.4 154.5 409.1 159.4L373.3 361.2zM400 48C382.3 48 368 62.33 368 80C368 97.67 382.3 112 400 112C417.7 112 432 97.67 432 80C432 62.33 417.7 48 400 48zM159.8 201.9C159.9 203.9 159.1 205.1 159.1 208C159.1 219.5 157.6 230.4 153.3 240.2L294.4 363.7C303.8 357.9 314.5 354 326 352.6L362.7 150.8C353.2 145.8 344.8 138.9 338.1 130.6L159.8 201.9zM336 400C318.3 400 304 414.3 304 432C304 449.7 318.3 464 336 464C353.7 464 368 449.7 368 432C368 414.3 353.7 400 336 400zM79.1 240C97.67 240 111.1 225.7 111.1 208C111.1 190.3 97.67 176 79.1 176C62.33 176 47.1 190.3 47.1 208C47.1 225.7 62.33 240 79.1 240z"
                        />
                    </svg>
                    3 related
                </div>
            </div> */}

            {article ? (
                <div className="info-bar gap-42 flex items-center justify-between whitespace-nowrap font-medium text-neutral-400 dark:text-neutral-500">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <img
                            className="w-4 shrink-0 rounded-sm opacity-75"
                            src={`https://www.google.com/s2/favicons?sz=128&domain=https://${getDomain(
                                article.url
                            )}`}
                        />

                        <div className="overflow-hidden text-ellipsis">{article?.title}</div>
                    </div>
                </div>
            ) : (
                <div className="text-base"> </div>
            )}
        </a>
    );
}

function LimitedText({
    className,
    text,
    rows = 8,
}: {
    className?: string;
    text?: string;
    rows?: number;
}) {
    return (
        <div
            className={clsx("overflow-hidden text-ellipsis leading-normal", className)}
            style={{
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: rows,
            }}
        >
            {/* <svg className="inline-block w-4" viewBox="0 0 448 512">
                <path
                    fill="currentColor"
                    d="m 296,160 c -30.93,0 -56,25.07 -56,56 0,30.93 25.07,56 56,56 2.74,0 5.365,-0.4258 8,-0.8066 V 280 c 0,13.23 -10.77,24 -24,24 -13.2,0 -24,10.8 -24,24 0,13.2 10.8,24 24,24 39.7,0 72,-32.3 72,-72 v -64 c 0,-30.9 -25.1,-56 -56,-56 z m -144,0 c -30.9,0 -56,25.1 -56,56 0,30.9 25.1,56 56,56 2.7,0 5.4,-0.4 8,-0.8 v 8.8 c 0,13.2 -10.8,24 -24,24 -13.25,0 -24,10.75 -24,24 0,13.25 10.8,24 24,24 39.7,0 72,-32.3 72,-72 v -64 c 0,-30.9 -25.1,-56 -56,-56 z"
                />
            </svg> */}
            {text}
            {/* &quot; */}
        </div>
    );
}
