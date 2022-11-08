import React, { useContext, useEffect, useState } from "react";
import { FilterButton, FilterContext } from "..";
import { getRandomLightColor } from "../../common";
import { listFeedItems } from "../../feeds/list";
import { Article, FeedSubscription, ReplicacheContext } from "../../store";
import { StaticArticleList } from "../ArticleList";
import { ResourceIcon } from "./components/numbers";

export default function FeedsModalTab({}) {
    const { currentSubscription } = useContext(FilterContext);
    const rep = useContext(ReplicacheContext);

    const [filteredSubscription, setFilteredSubscription] = useState<FeedSubscription | undefined>(
        currentSubscription
    );
    // const [allSubscriptions, setAllSubscriptions] = useState<FeedSubscription[]>();
    // useEffect(() => {
    //     rep?.query.listSubscriptions().then((subscriptions) => {
    //         setAllSubscriptions(subscriptions);
    //         setFilteredSubscription(subscriptions[2]);
    //     });
    // }, [rep]);

    const [articles, setArticles] = useState<Article[]>();
    useEffect(() => {
        if (filteredSubscription) {
            listFeedItems(filteredSubscription).then(setArticles);
        }
    }, [filteredSubscription]);

    if (!filteredSubscription) {
        return <></>;
    }

    return (
        <div className="flex flex-col gap-4">
            <div>
                <div className="info-bar flex justify-start gap-3 font-medium">
                    <div className="flex items-center gap-2">
                        <img
                            className="h-5 w-5"
                            src={`https://www.google.com/s2/favicons?sz=128&domain=https://${filteredSubscription.domain}`}
                        />
                        {filteredSubscription.title}
                    </div>

                    <div>{filteredSubscription ? "Following" : "Follow"}</div>
                </div>
            </div>

            {filteredSubscription.description && <div>{filteredSubscription.description}</div>}

            <div className="filter-list flex justify-start gap-3">
                <FilterButton
                    title={false ? "In library" : "All articles"}
                    icon={
                        false ? (
                            <ResourceIcon type="articles" />
                        ) : (
                            <svg className="h-4" viewBox="0 0 448 512">
                                <path
                                    fill="currentColor"
                                    d="M88 32C110.1 32 128 49.91 128 72V120C128 142.1 110.1 160 88 160H40C17.91 160 0 142.1 0 120V72C0 49.91 17.91 32 40 32H88zM88 72H40V120H88V72zM88 192C110.1 192 128 209.9 128 232V280C128 302.1 110.1 320 88 320H40C17.91 320 0 302.1 0 280V232C0 209.9 17.91 192 40 192H88zM88 232H40V280H88V232zM0 392C0 369.9 17.91 352 40 352H88C110.1 352 128 369.9 128 392V440C128 462.1 110.1 480 88 480H40C17.91 480 0 462.1 0 440V392zM40 440H88V392H40V440zM248 32C270.1 32 288 49.91 288 72V120C288 142.1 270.1 160 248 160H200C177.9 160 160 142.1 160 120V72C160 49.91 177.9 32 200 32H248zM248 72H200V120H248V72zM160 232C160 209.9 177.9 192 200 192H248C270.1 192 288 209.9 288 232V280C288 302.1 270.1 320 248 320H200C177.9 320 160 302.1 160 280V232zM200 280H248V232H200V280zM248 352C270.1 352 288 369.9 288 392V440C288 462.1 270.1 480 248 480H200C177.9 480 160 462.1 160 440V392C160 369.9 177.9 352 200 352H248zM248 392H200V440H248V392zM320 72C320 49.91 337.9 32 360 32H408C430.1 32 448 49.91 448 72V120C448 142.1 430.1 160 408 160H360C337.9 160 320 142.1 320 120V72zM360 120H408V72H360V120zM408 192C430.1 192 448 209.9 448 232V280C448 302.1 430.1 320 408 320H360C337.9 320 320 302.1 320 280V232C320 209.9 337.9 192 360 192H408zM408 232H360V280H408V232zM320 392C320 369.9 337.9 352 360 352H408C430.1 352 448 369.9 448 392V440C448 462.1 430.1 480 408 480H360C337.9 480 320 462.1 320 440V392zM360 440H408V392H360V440z"
                                />
                            </svg>
                        )
                    }
                    onClick={() => {}}
                />
                <FilterButton
                    title={true ? "Newest first" : "Oldest first"}
                    icon={
                        true ? (
                            <svg className="h-4" viewBox="0 0 512 512">
                                <path
                                    fill="currentColor"
                                    d="M416 320h-96c-17.6 0-32 14.4-32 32v96c0 17.6 14.4 32 32 32h96c17.6 0 32-14.4 32-32v-96C448 334.4 433.6 320 416 320zM400 432h-64v-64h64V432zM480 32h-160c-17.67 0-32 14.33-32 32v160c0 17.67 14.33 32 32 32h160c17.67 0 32-14.33 32-32V64C512 46.33 497.7 32 480 32zM464 208h-128v-128h128V208zM145.6 39.37c-9.062-9.82-26.19-9.82-35.25 0L14.38 143.4c-9 9.758-8.406 24.96 1.344 33.94C20.35 181.7 26.19 183.8 32 183.8c6.469 0 12.91-2.594 17.62-7.719L104 117.1v338.9C104 469.2 114.8 480 128 480s24-10.76 24-24.02V117.1l54.37 58.95C215.3 185.8 230.5 186.5 240.3 177.4C250 168.4 250.6 153.2 241.6 143.4L145.6 39.37z"
                                />
                            </svg>
                        ) : (
                            <svg className="h-4" viewBox="0 0 512 512">
                                <path
                                    fill="currentColor"
                                    d="M480 32h-160c-17.67 0-32 14.33-32 32v160c0 17.67 14.33 32 32 32h160c17.67 0 32-14.33 32-32V64C512 46.33 497.7 32 480 32zM464 208h-128v-128h128V208zM416 320h-96c-17.6 0-32 14.4-32 32v96c0 17.6 14.4 32 32 32h96c17.6 0 32-14.4 32-32v-96C448 334.4 433.6 320 416 320zM400 432h-64v-64h64V432zM206.4 335.1L152 394.9V56.02C152 42.76 141.3 32 128 32S104 42.76 104 56.02v338.9l-54.37-58.95c-4.719-5.125-11.16-7.719-17.62-7.719c-5.812 0-11.66 2.094-16.28 6.375c-9.75 8.977-10.34 24.18-1.344 33.94l95.1 104.1c9.062 9.82 26.19 9.82 35.25 0l95.1-104.1c9-9.758 8.406-24.96-1.344-33.94C230.5 325.5 215.3 326.2 206.4 335.1z"
                                />
                            </svg>
                        )
                    }
                    onClick={() => {}}
                />
            </div>

            <StaticArticleList articles={articles || []} small />
        </div>
    );
}
