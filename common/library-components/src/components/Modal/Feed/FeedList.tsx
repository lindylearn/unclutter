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

    // useEffect(() => {
    //     rep?.query.listSubscriptions().then((subscriptions) => {
    //         const active = subscriptions.filter((s) => s.is_subscribed);
    //         const inactive = subscriptions.filter((s) => !s.is_subscribed);
    //         subscriptions = active.concat(inactive);

    //         setAllSubscriptions(subscriptions);
    //     });
    // }, [rep]);

    return (
        <div className="flex flex-col gap-4">
            {allSubscriptions?.map((subscription) => (
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
