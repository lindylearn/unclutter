import React, { useContext, useEffect, useState } from "react";
import { FilterContext } from "../..";
import { FeedSubscription, ReplicacheContext } from "../../../store";
import { FeedCard } from "./FeedDetails";

export default function FeedListTab({ darkModeEnabled }) {
    const { currentSubscription, setCurrentSubscription } = useContext(FilterContext);
    const rep = useContext(ReplicacheContext);

    const [allSubscriptions, setAllSubscriptions] = useState<FeedSubscription[]>();
    useEffect(() => {
        rep?.query.listSubscriptions().then((subscriptions) => {
            setAllSubscriptions(subscriptions);
        });
    }, [rep]);

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
