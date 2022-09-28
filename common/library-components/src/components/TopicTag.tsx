import React from "react";
import clsx from "clsx";
import { useContext } from "react";
import Twemoji from "react-twemoji";
import { Link } from "wouter";

import { ReplicacheContext, Topic, useSubscribe } from "../store";
import { getRandomColor } from "../common/styling";

export function TopicTag({
    topic_id,
    colorSeed,
    fadedOut = false,
    focused = false,
    noBackground = false,
    large = false,
    onClick = undefined,
    className = "",
}: {
    topic_id: string;
    colorSeed?: string;
    fadedOut?: boolean;
    focused?: boolean;
    noBackground?: boolean;
    large?: boolean;
    onClick?: () => void;
    className?: string;
}) {
    const rep = useContext(ReplicacheContext);
    const topic: any = useSubscribe(
        rep,
        rep?.subscribe.getTopic(topic_id),
        null
    );

    let topicColor = getRandomColor(colorSeed || topic?.group_id);
    if (fadedOut) {
        topicColor = topicColor.replace("0.4)", "0.15)");
    }

    // TODO optimize performance by batching counting?
    const articleCount = useSubscribe(
        rep,
        rep?.subscribe.getTopicArticlesCount(topic_id),
        null
    );

    const innerComponent = (
        <UITag
            fadedOut={fadedOut}
            focused={focused}
            noBackground={noBackground}
            color={topicColor}
            large={large}
            IconComponent={
                <TopicEmoji emoji={topic?.emoji || ""} large={large} />
            }
            title={topic?.name}
            count={(articleCount || null) as any}
            onClick={onClick || (() => {})}
        />
    );

    if (onClick) {
        return innerComponent;
    } else {
        return (
            <Link href={getTopicUrl(topic) || ""}>
                <div className={clsx("w-max max-w-full", className)}>
                    {innerComponent}
                </div>
            </Link>
        );
    }
}

export function TopicEmoji({
    emoji,
    large,
    className = "",
}: {
    emoji: string;
    large?: boolean;
    className?: string;
}) {
    return (
        <Twemoji noWrapper>
            <span
                className={clsx(
                    "mr-2 inline-block w-5 flex-shrink-0 align-top drop-shadow-sm",
                    className
                )}
            >
                {emoji}
            </span>
        </Twemoji>
    );
}

export function UITag({
    fadedOut,
    focused,
    noBackground = false,
    color,
    large = false,
    IconComponent,
    title,
    count = null,
    className = "",
    onClick = () => {},
}) {
    return (
        <div
            className={clsx(
                "ui-tag relative mr-1 flex cursor-pointer select-none items-center rounded-lg px-2 py-1 font-medium text-stone-800 transition-all hover:scale-[97%] hover:shadow dark:text-stone-200",
                fadedOut && "opacity-80",
                focused && "shadow-lg",
                noBackground && `no-background`,
                className,
                large
                    ? "font-title py-0.5 text-xl text-stone-700 opacity-80 hover:opacity-100"
                    : "text-sm"
            )}
            style={{ background: color }}
            onClick={onClick}
        >
            {IconComponent}
            <div className="max-w-full overflow-hidden overflow-ellipsis whitespace-nowrap">
                {title}
            </div>
            {count && (
                <div className="count opacity-1 absolute -top-2 -right-2 rounded-full bg-white px-1 text-sm shadow-sm transition-opacity dark:bg-stone-600">
                    {count}
                </div>
            )}
        </div>
    );
}

export function getTopicUrl(topic?: Topic | null): string | null {
    if (!topic) {
        return null;
    }

    const group_id = topic.group_id?.replaceAll(" ", "-");
    const base = `/topics/${group_id}`;
    let suffix = "";
    if (!topic.id.startsWith("-")) {
        suffix = `#${topicNameToUrl(topic.name)}`;
    }

    return `${base}${suffix}`;
}

export function topicNameToUrl(name: string) {
    return name.toLowerCase().replace(/ /g, "-");
}
