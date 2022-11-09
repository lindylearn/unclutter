import React, { useContext, useEffect, useState } from "react";
import { FilterContext } from "../..";
import { FeedSubscription, ReplicacheContext, useSubscribe } from "../../../store";
import { FeedCard } from "./FeedDetails";

export default function FeedListTab({ darkModeEnabled }) {
    const { setCurrentSubscription } = useContext(FilterContext);
    const rep = useContext(ReplicacheContext);

    const allSubscriptions = useSubscribe(
        rep,
        rep?.subscribe.listSubscriptions(),
        null,
        []
    ) as FeedSubscription[];

    const displayedSubscriptions = allSubscriptions?.sort((a, b) => {
        return a.time_added - b.time_added;
    });

    return (
        <div className="flex flex-col gap-4">
            {displayedSubscriptions?.map((subscription) => (
                <FeedCard
                    subscription={subscription}
                    darkModeEnabled={darkModeEnabled}
                    isListEntry
                    setCurrentSubscription={setCurrentSubscription}
                />
            ))}
        </div>
    );
}
