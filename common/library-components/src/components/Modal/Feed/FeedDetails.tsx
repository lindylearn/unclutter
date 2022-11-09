import clsx from "clsx";
import React, { useContext, useEffect, useState } from "react";
import { FilterButton, FilterContext } from "../..";
import { getRandomLightColor } from "../../../common";
import { listFeedItemsContentScript, listFeedItemsWeb } from "../../../feeds/list";
import { Article, FeedSubscription, ReplicacheContext, useSubscribe } from "../../../store";
import { StaticArticleList } from "../../ArticleList";
import { ResourceIcon } from "../components/numbers";

export default function FeedDetailsTab({ darkModeEnabled }) {
    const { currentSubscription, setCurrentSubscription } = useContext(FilterContext);
    const rep = useContext(ReplicacheContext);

    const filteredSubscription = useSubscribe(
        rep,
        // @ts-ignore
        rep?.subscribe.getSubscription(currentSubscription?.id),
        null,
        [currentSubscription?.id]
    ) as FeedSubscription;

    const [articles, setArticles] = useState<Article[]>();
    useEffect(() => {
        if (filteredSubscription) {
            if (window.location.href === "http://localhost:3000/modal") {
                listFeedItemsWeb(filteredSubscription).then(setArticles);
            } else {
                listFeedItemsContentScript(filteredSubscription).then(setArticles);
            }
        }
    }, [filteredSubscription]);

    if (!filteredSubscription) {
        return <></>;
    }

    return (
        <div className="flex flex-col gap-4">
            <FeedCard subscription={filteredSubscription} darkModeEnabled={darkModeEnabled} />

            <div className="filter-list flex justify-start gap-3">
                <FilterButton
                    title={"Back"}
                    icon={
                        <svg className="h-4" viewBox="0 0 512 512">
                            <path
                                fill="currentColor"
                                d="M176.1 103C181.7 107.7 184 113.8 184 120S181.7 132.3 176.1 136.1L81.94 232H488C501.3 232 512 242.8 512 256s-10.75 24-24 24H81.94l95.03 95.03c9.375 9.375 9.375 24.56 0 33.94s-24.56 9.375-33.94 0l-136-136c-9.375-9.375-9.375-24.56 0-33.94l136-136C152.4 93.66 167.6 93.66 176.1 103z"
                            />
                        </svg>
                    }
                    onClick={() => setCurrentSubscription()}
                />

                <FilterButton
                    title={filteredSubscription.is_subscribed ? "Unfollow" : "Follow"}
                    icon={
                        filteredSubscription.is_subscribed ? (
                            <svg className="w-5" viewBox="0 0 448 512">
                                <path
                                    fill="currentColor"
                                    d="M440.1 103C450.3 112.4 450.3 127.6 440.1 136.1L176.1 400.1C167.6 410.3 152.4 410.3 143 400.1L7.029 264.1C-2.343 255.6-2.343 240.4 7.029 231C16.4 221.7 31.6 221.7 40.97 231L160 350.1L407 103C416.4 93.66 431.6 93.66 440.1 103V103z"
                                />
                            </svg>
                        ) : (
                            <svg className="w-5" viewBox="0 0 448 512">
                                <path
                                    fill="currentColor"
                                    d="M432 256C432 269.3 421.3 280 408 280h-160v160c0 13.25-10.75 24.01-24 24.01S200 453.3 200 440v-160h-160c-13.25 0-24-10.74-24-23.99C16 242.8 26.75 232 40 232h160v-160c0-13.25 10.75-23.99 24-23.99S248 58.75 248 72v160h160C421.3 232 432 242.8 432 256z"
                                />
                            </svg>
                        )
                    }
                    color={
                        !filteredSubscription.is_subscribed
                            ? getRandomLightColor(filteredSubscription.domain, darkModeEnabled)
                            : undefined
                    }
                    onClick={() => rep?.mutate.toggleSubscriptionActive(filteredSubscription.id)}
                />
            </div>

            <StaticArticleList articles={articles || []} small />
        </div>
    );
}

export function FeedCard({
    subscription,
    darkModeEnabled,
    isListEntry = false,
    setCurrentSubscription,
}: {
    subscription: FeedSubscription;
    darkModeEnabled: boolean;
    isListEntry?: boolean;
    setCurrentSubscription?: (subscription: FeedSubscription) => void;
}) {
    const rep = useContext(ReplicacheContext);

    return (
        <div
            className={clsx(
                "info-box flex flex-grow justify-start",
                isListEntry && "cursor-pointer transition-transform hover:scale-[99%]"
            )}
            onClick={() => setCurrentSubscription?.(subscription)}
        >
            <div
                className="title flex flex-grow items-center gap-3 rounded-md bg-stone-100 p-3 transition-colors dark:bg-neutral-800"
                style={{
                    background: subscription.is_subscribed
                        ? getRandomLightColor(subscription.domain, darkModeEnabled)
                        : undefined,
                }}
            >
                <img
                    className={clsx(
                        "h-10 w-10 flex-shrink-0 rounded-md transition-all",
                        !subscription.is_subscribed && "grayscale"
                    )}
                    src={`https://www.google.com/s2/favicons?sz=128&domain=https://${subscription.domain}`}
                />
                <div className="flex flex-grow flex-col items-start">
                    <h1 className="font-title text-lg font-bold leading-tight">
                        {subscription.title}
                    </h1>
                    <div className="flex w-full justify-between gap-3 text-base">
                        <a
                            className={clsx(
                                "block",
                                !isListEntry && "transition-transform hover:scale-[97%]"
                            )}
                            href={!isListEntry ? subscription.link : undefined}
                        >
                            {subscription.domain}
                        </a>

                        {/* <div>{subscription.post_frequency}</div> */}
                    </div>
                </div>
            </div>

            {/* <div
                className="flex flex-shrink-0 origin-left cursor-pointer select-none items-center gap-2 self-stretch rounded-r-md bg-stone-100 px-5 font-medium transition-colors dark:bg-neutral-800"
                style={{
                    background: !subscription.is_subscribed
                        ? getRandomLightColor(subscription.domain, darkModeEnabled)
                        : undefined,
                }}
                onClick={(e) => {
                    rep?.mutate.toggleSubscriptionActive(subscription.id);
                    e.stopPropagation();
                }}
            >
                {subscription.is_subscribed ? (
                    <svg className="w-5" viewBox="0 0 448 512">
                        <path
                            fill="currentColor"
                            d="M440.1 103C450.3 112.4 450.3 127.6 440.1 136.1L176.1 400.1C167.6 410.3 152.4 410.3 143 400.1L7.029 264.1C-2.343 255.6-2.343 240.4 7.029 231C16.4 221.7 31.6 221.7 40.97 231L160 350.1L407 103C416.4 93.66 431.6 93.66 440.1 103V103z"
                        />
                    </svg>
                ) : (
                    <svg className="w-5" viewBox="0 0 448 512">
                        <path
                            fill="currentColor"
                            d="M432 256C432 269.3 421.3 280 408 280h-160v160c0 13.25-10.75 24.01-24 24.01S200 453.3 200 440v-160h-160c-13.25 0-24-10.74-24-23.99C16 242.8 26.75 232 40 232h160v-160c0-13.25 10.75-23.99 24-23.99S248 58.75 248 72v160h160C421.3 232 432 242.8 432 256z"
                        />
                    </svg>
                )}

                {subscription.is_subscribed ? "Following" : "Follow"}
            </div> */}
        </div>
    );
}
