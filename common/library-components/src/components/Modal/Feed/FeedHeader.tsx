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
                        <div className="flex-grow">{subscription.title || subscription.domain}</div>

                        {subscription.is_subscribed && (
                            <div className="animate-fadein flex items-center gap-2">
                                <svg className="h-4" viewBox="0 0 512 512">
                                    <path
                                        fill="currentColor"
                                        d="M464 320h-96c-9.094 0-17.41 5.125-21.47 13.28L321.2 384H190.8l-25.38-50.72C161.4 325.1 153.1 320 144 320H32c-17.67 0-32 14.33-32 32v96c0 35.35 28.65 64 64 64h384c35.35 0 64-28.65 64-64v-80C512 341.5 490.5 320 464 320zM464 448c0 8.822-7.178 16-16 16H64c-8.822 0-16-7.178-16-16v-80h81.16l25.38 50.72C158.6 426.9 166.9 432 176 432h160c9.094 0 17.41-5.125 21.47-13.28L382.8 368H464V448zM238.4 312.3C242.1 317.2 249.3 320 256 320s13.03-2.781 17.59-7.656l104-112c9-9.719 8.438-24.91-1.25-33.94c-9.719-8.969-24.88-8.438-33.94 1.25L280 234.9V24c0-13.25-10.75-24-24-24S232 10.75 232 24v210.9L169.6 167.7C160.5 157.1 145.4 157.4 135.7 166.4C125.1 175.4 125.4 190.6 134.4 200.3L238.4 312.3z"
                                    />
                                </svg>
                                <span className="font-text whitespace-nowrap text-base font-medium leading-tight">
                                    Following since{" "}
                                    {getRelativeTime(subscription.time_added * 1000)}
                                </span>
                            </div>
                        )}
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
