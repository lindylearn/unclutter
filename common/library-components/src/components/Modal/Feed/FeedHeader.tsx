import clsx from "clsx";
import React, { useContext } from "react";
import {
    formatPostFrequency,
    getRandomLightColor,
    getRelativeTime,
    sendMessage,
} from "../../../common";
import { FeedSubscription, ReplicacheContext } from "../../../store";
import { ResourceStat } from "../components/numbers";

export function FeedHeader({
    subscription,
    darkModeEnabled,
    isListEntry = false,
    onClick,
}: {
    subscription: FeedSubscription;
    darkModeEnabled: boolean;
    isListEntry?: boolean;
    onClick?: () => void;
}) {
    const rep = useContext(ReplicacheContext);

    return (
        <div
            className={clsx(
                "info-box flex flex-grow justify-start",
                isListEntry && "cursor-pointer transition-transform hover:scale-[99%]"
            )}
            onClick={onClick}
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
                    <h1 className="font-title flex w-full gap-3 text-lg font-bold leading-tight">
                        <div className="flex-grow">{subscription.title}</div>

                        {/* {subscription.is_subscribed && (
                            <div className="animate-fadein flex items-center gap-2">
                                <svg className="h-4" viewBox="0 0 448 512">
                                    <path
                                        fill="currentColor"
                                        d="M440.1 103C450.3 112.4 450.3 127.6 440.1 136.1L176.1 400.1C167.6 410.3 152.4 410.3 143 400.1L7.029 264.1C-2.343 255.6-2.343 240.4 7.029 231C16.4 221.7 31.6 221.7 40.97 231L160 350.1L407 103C416.4 93.66 431.6 93.66 440.1 103V103z"
                                    />
                                </svg>
                                <span className="font-text whitespace-nowrap text-base font-medium leading-tight">
                                    Following since{" "}
                                    {getRelativeTime(subscription.time_added * 1000)}
                                </span>
                            </div>
                        )} */}
                    </h1>
                    <div className="flex w-full justify-between gap-3 text-base">
                        <a
                            className={clsx(
                                "block",
                                !isListEntry && "transition-transform hover:scale-[97%]"
                            )}
                            href={!isListEntry ? subscription.link : undefined}
                            onClick={(e) => {
                                if (!isListEntry) {
                                    e.preventDefault();
                                    sendMessage({
                                        event: "openLink",
                                        url: subscription.link,
                                        newTab: true,
                                    });
                                }
                            }}
                        >
                            {subscription.domain}
                        </a>

                        <div className="">{formatPostFrequency(subscription.post_frequency)}</div>
                    </div>
                </div>
            </div>

            {/* <div className="flex gap-3">
                <ResourceStat
                    type="articles_completed"
                    value={1}
                    className="text-lg leading-tight"
                />
                <ResourceStat type="articles" value={3} className="text-lg leading-tight" />
            </div> */}
        </div>
    );
}
