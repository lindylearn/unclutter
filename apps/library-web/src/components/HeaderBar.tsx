import clsx from "clsx";
import { useContext } from "react";
import { useSubscribe } from "replicache-react";
import { Link, useLocation } from "wouter";

import { LibraryTab } from "../App";
import { getRandomColor } from "@unclutter/library-components/dist/common";
import {
    getTopic,
    ReplicacheContext,
} from "@unclutter/library-components/dist/store";
import {
    LindyIcon,
    TopicEmoji,
} from "@unclutter/library-components/dist/components";

export default function HeaderBar({
    tabs,
    articleCount,
    searchQuery,
    setSearchQuery,
    selectedTopicId,
    setSelectedTopicId,
}: {
    tabs: LibraryTab[];
    articleCount: number | null;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedTopicId?: string | null;
    setSelectedTopicId: (topicId: string | null) => void;
}) {
    const [location, _] = useLocation();

    const rep = useContext(ReplicacheContext);
    const topic = useSubscribe(
        rep,
        (tx) => getTopic(tx, selectedTopicId || ""),
        null,
        [rep, selectedTopicId]
    );
    let topicColor = getRandomColor(topic?.id || "");

    return (
        <header className="bg-lindy dark:bg-lindyDark fixed top-0 flex h-12 w-full gap-3 py-2 px-3 text-stone-800 shadow">
            <Link href="/">
                <div
                    className={clsx(
                        "font-title flex w-44 cursor-pointer items-center gap-1.5 text-2xl font-bold transition-all hover:scale-[98%]"
                    )}
                >
                    <LindyIcon className="inline-block w-10" />
                    <span>Unclutter</span>
                </div>
            </Link>

            <div className="dark:backgroundDark flex w-5/12 gap-3 rounded-lg bg-white px-2 shadow-sm dark:bg-stone-800 dark:text-stone-300">
                {topic && (
                    <div
                        className="search-topic relative -ml-2 flex cursor-pointer select-none items-center rounded-l-lg px-3 font-medium opacity-80 shadow-sm"
                        style={{
                            background: topicColor.replace("0.4)", "0.2)"),
                        }}
                        onClick={() => setSelectedTopicId(null)}
                    >
                        <span className="search-topic-name opacity-1 font-title flex items-center transition-all">
                            <TopicEmoji emoji={topic.emoji!} />
                            {topic.name}
                        </span>
                        {/* <svg
                            className="search-topic-delete absolute right-1 h-3 opacity-0 transition-all"
                            viewBox="0 0 384 512"
                        >
                            <path
                                fill="currentColor"
                                d="M376.6 427.5c11.31 13.58 9.484 33.75-4.094 45.06c-5.984 4.984-13.25 7.422-20.47 7.422c-9.172 0-18.27-3.922-24.59-11.52L192 305.1l-135.4 162.5c-6.328 7.594-15.42 11.52-24.59 11.52c-7.219 0-14.48-2.438-20.47-7.422c-13.58-11.31-15.41-31.48-4.094-45.06l142.9-171.5L7.422 84.5C-3.891 70.92-2.063 50.75 11.52 39.44c13.56-11.34 33.73-9.516 45.06 4.094L192 206l135.4-162.5c11.3-13.58 31.48-15.42 45.06-4.094c13.58 11.31 15.41 31.48 4.094 45.06l-142.9 171.5L376.6 427.5z"
                            />
                        </svg> */}
                    </div>
                )}
                <input
                    className="font-text flex-grow rounded-lg bg-white font-medium leading-none placeholder-stone-500 outline-none dark:bg-stone-800 dark:placeholder:text-stone-500"
                    spellCheck="false"
                    autoFocus
                    placeholder={
                        articleCount === null
                            ? "Fetching articles..."
                            : `Search across ${articleCount} article${
                                  articleCount !== 1 ? "s" : ""
                              }...`
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Backspace") {
                            setSelectedTopicId(null);
                        }
                    }}
                />
            </div>

            <div className="-ml-1 flex max-h-full flex-grow items-center gap-3 text-2xl">
                {tabs
                    .filter((t) => t.showInHeader)
                    .map((tab) => (
                        <Tab key={tab.id} {...tab} />
                    ))}
            </div>

            <div className="-mr-1 flex max-h-full items-center text-2xl">
                <Tab id={"settings"} />
            </div>
        </header>
    );
}

function Tab({ id }) {
    const [location, _] = useLocation();
    const path = location.slice(1).split("/")[0];
    const isActive = path.startsWith(id.split("/")[0]);

    return (
        <div
            className={clsx(
                "relative rounded-t-lg",
                isActive && "dark:bg-backgroundDark bg-white"
            )}
        >
            <Link href={`/${id}`.replace("/:topic_id", "")}>
                <button
                    className={clsx(
                        "relative top-1.5 z-50 w-10 cursor-pointer px-2 drop-shadow-sm transition-all",
                        isActive && "drop-shadow-md dark:text-stone-300",
                        !isActive && "hover:scale-95"
                    )}
                >
                    {id === "search" && (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 512 512"
                            className="h-6 w-6"
                        >
                            <path
                                fill="currentColor"
                                d="M500.3 443.7l-119.7-119.7c27.22-40.41 40.65-90.9 33.46-144.7C401.8 87.79 326.8 13.32 235.2 1.723C99.01-15.51-15.51 99.01 1.724 235.2c11.6 91.64 86.08 166.7 177.6 178.9c53.8 7.189 104.3-6.236 144.7-33.46l119.7 119.7c15.62 15.62 40.95 15.62 56.57 0C515.9 484.7 515.9 459.3 500.3 443.7zM79.1 208c0-70.58 57.42-128 128-128s128 57.42 128 128c0 70.58-57.42 128-128 128S79.1 278.6 79.1 208z"
                            />
                        </svg>
                    )}
                    {id === "recent" && (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 512 512"
                            className="h-6 w-6"
                        >
                            <path
                                fill="currentColor"
                                d="M256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512C201.7 512 151.2 495 109.7 466.1C95.2 455.1 91.64 436 101.8 421.5C111.9 407 131.8 403.5 146.3 413.6C177.4 435.3 215.2 448 256 448C362 448 448 362 448 256C448 149.1 362 64 256 64C202.1 64 155 85.46 120.2 120.2L151 151C166.1 166.1 155.4 192 134.1 192H24C10.75 192 0 181.3 0 168V57.94C0 36.56 25.85 25.85 40.97 40.97L74.98 74.98C121.3 28.69 185.3 0 255.1 0L256 0zM256 128C269.3 128 280 138.7 280 152V246.1L344.1 311C354.3 320.4 354.3 335.6 344.1 344.1C335.6 354.3 320.4 354.3 311 344.1L239 272.1C234.5 268.5 232 262.4 232 256V152C232 138.7 242.7 128 256 128V128z"
                            />
                        </svg>
                    )}
                    {id === "topics" && (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 512 512"
                            className="h-6 w-6"
                        >
                            <path
                                fill="currentColor"
                                d="M160 384l127.1 .0001V128L160 128V384zM96 .0028H31.1C14.37 .0028 0 14.38 0 32v63.1l128-.0008l.0008-63.1C128 14.38 113.6 .0028 96 .0028zM160 479.1c0 17.62 14.37 31.1 32 31.1h63.1c17.62 0 31.98-14.36 31.1-31.98l0-64.02h-127.1L160 479.1zM0 479.1c0 17.62 14.37 31.1 31.1 31.1h64c17.62 0 31.1-14.37 31.1-31.1L128 416H0V479.1zM0 384l128-.0001V128L0 128V384zM419.9 116.2l-123.6 33.04l66.21 246.7l123.7-33.04L419.9 116.2zM510.9 455.3l-16.48-61.67l-123.6 33.05l16.55 61.66c4.559 16.98 22.15 27.12 39.17 22.57l61.85-16.52C505.4 489.8 515.5 472.3 510.9 455.3zM395 23.64c-4.568-16.98-22.15-27.1-39.16-22.55l-61.78 16.52c-3.072 .8203-5.619 2.484-8.197 4.07c-4.348-12.52-15.93-21.68-29.9-21.68h-63.1c-17.63 0-32 14.37-32 31.1L160 96l122 .0014l6.004 22.37l123.5-33.05L395 23.64z"
                            />
                        </svg>
                    )}
                    {id === "favorites" && (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 576 512"
                            className="h-6 w-6"
                        >
                            <path
                                fill="currentColor"
                                d="M381.2 150.3L524.9 171.5C536.8 173.2 546.8 181.6 550.6 193.1C554.4 204.7 551.3 217.3 542.7 225.9L438.5 328.1L463.1 474.7C465.1 486.7 460.2 498.9 450.2 506C440.3 513.1 427.2 514 416.5 508.3L288.1 439.8L159.8 508.3C149 514 135.9 513.1 126 506C116.1 498.9 111.1 486.7 113.2 474.7L137.8 328.1L33.58 225.9C24.97 217.3 21.91 204.7 25.69 193.1C29.46 181.6 39.43 173.2 51.42 171.5L195 150.3L259.4 17.97C264.7 6.954 275.9-.0391 288.1-.0391C300.4-.0391 311.6 6.954 316.9 17.97L381.2 150.3z"
                            />
                        </svg>
                    )}
                    {id === "settings" && (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 512 512"
                            className="h-6 w-6"
                        >
                            <path
                                fill="currentColor"
                                d="M495.9 166.6C499.2 175.2 496.4 184.9 489.6 191.2L446.3 230.6C447.4 238.9 448 247.4 448 256C448 264.6 447.4 273.1 446.3 281.4L489.6 320.8C496.4 327.1 499.2 336.8 495.9 345.4C491.5 357.3 486.2 368.8 480.2 379.7L475.5 387.8C468.9 398.8 461.5 409.2 453.4 419.1C447.4 426.2 437.7 428.7 428.9 425.9L373.2 408.1C359.8 418.4 344.1 427 329.2 433.6L316.7 490.7C314.7 499.7 307.7 506.1 298.5 508.5C284.7 510.8 270.5 512 255.1 512C241.5 512 227.3 510.8 213.5 508.5C204.3 506.1 197.3 499.7 195.3 490.7L182.8 433.6C167 427 152.2 418.4 138.8 408.1L83.14 425.9C74.3 428.7 64.55 426.2 58.63 419.1C50.52 409.2 43.12 398.8 36.52 387.8L31.84 379.7C25.77 368.8 20.49 357.3 16.06 345.4C12.82 336.8 15.55 327.1 22.41 320.8L65.67 281.4C64.57 273.1 64 264.6 64 256C64 247.4 64.57 238.9 65.67 230.6L22.41 191.2C15.55 184.9 12.82 175.3 16.06 166.6C20.49 154.7 25.78 143.2 31.84 132.3L36.51 124.2C43.12 113.2 50.52 102.8 58.63 92.95C64.55 85.8 74.3 83.32 83.14 86.14L138.8 103.9C152.2 93.56 167 84.96 182.8 78.43L195.3 21.33C197.3 12.25 204.3 5.04 213.5 3.51C227.3 1.201 241.5 0 256 0C270.5 0 284.7 1.201 298.5 3.51C307.7 5.04 314.7 12.25 316.7 21.33L329.2 78.43C344.1 84.96 359.8 93.56 373.2 103.9L428.9 86.14C437.7 83.32 447.4 85.8 453.4 92.95C461.5 102.8 468.9 113.2 475.5 124.2L480.2 132.3C486.2 143.2 491.5 154.7 495.9 166.6V166.6zM256 336C300.2 336 336 300.2 336 255.1C336 211.8 300.2 175.1 256 175.1C211.8 175.1 176 211.8 176 255.1C176 300.2 211.8 336 256 336z"
                            />
                        </svg>
                    )}
                </button>
            </Link>

            {isActive && (
                <>
                    <div
                        className="tab-rounded-spacer absolute -bottom-[8.2px] -left-[20px] block h-[20px] w-[20px] rounded-full"
                        style={{
                            clipPath: "inset(50% -20px 0 50%)",
                        }}
                    />
                    {id !== "settings" ? (
                        <div
                            className="tab-rounded-spacer absolute -bottom-[8.2px] -right-[20px] block h-[20px] w-[20px] rounded-full"
                            style={{
                                clipPath: "inset(50% 50% 0 -40px)",
                            }}
                        />
                    ) : (
                        <div className="dark:bg-backgroundDark absolute -bottom-2 -right-[0] block h-[20px] w-[20px] bg-white" />
                    )}
                </>
            )}
        </div>
    );
}
