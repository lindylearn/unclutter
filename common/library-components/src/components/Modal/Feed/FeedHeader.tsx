import clsx from "clsx";
import React, { useContext } from "react";
import { getRandomLightColor, sendMessage } from "../../../common";
import { FeedSubscription, ReplicacheContext } from "../../../store";
import { ResourceStat } from "../components/numbers";

export function FeedHeader({
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
                    <h1 className="font-title flex w-full gap-3 text-lg font-bold leading-tight">
                        <div className="flex-grow">{subscription.title}</div>
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

                        <div className="">{subscription.post_frequency}</div>
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
