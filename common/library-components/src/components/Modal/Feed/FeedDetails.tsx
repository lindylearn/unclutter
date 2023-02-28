import React, { useContext, useEffect, useState } from "react";
import { getRandomLightColor } from "../../../common";
import { Article, FeedSubscription, ReplicacheContext, useSubscribe } from "../../../store";
import { FeedHeader } from "./FeedHeader";
import { ArticleListsCache, DraggableContext } from "../../ArticleList/DraggableContext";
import { FilterContext } from "../context";
import { FilterButton } from "../Recent";
import { ArticleGroup } from "../../ArticleList";

export default function FeedDetailsTab({ darkModeEnabled, reportEvent }) {
    const { currentSubscription, setCurrentSubscription } = useContext(FilterContext);
    const rep = useContext(ReplicacheContext);

    const filteredSubscription = useSubscribe<FeedSubscription | null>(
        rep,
        rep?.subscribe.getSubscription(currentSubscription?.id || ""),
        null,
        [currentSubscription?.id]
    );

    const [feedArticles, setFeedArticles] = useState<Article[]>();
    // useEffect(() => {
    //     if (filteredSubscription) {
    //         if (window.location.href === "http://localhost:3000/modal") {
    //             listFeedItemsWeb(filteredSubscription).then(setFeedArticles);
    //         } else {
    //             listFeedItemsContentScript(filteredSubscription).then(setFeedArticles);
    //         }
    //     }
    // }, [filteredSubscription]);

    const [articleListCache, setArticleListCache] = useState<ArticleListsCache>({});

    const libraryArticles = useSubscribe<Article[] | null>(
        rep,
        rep?.subscribe.listDomainArticles(filteredSubscription?.domain || ""),
        null,
        [filteredSubscription?.domain]
    );

    useEffect(() => {
        if (!filteredSubscription) {
            return;
        }

        // const libraryArticlesSet = new Set((libraryArticles || []).map((a) => a.id));
        // const pastArticles = (feedArticles || []).filter((a) => !libraryArticlesSet.has(a.id));

        const savedArticles = (libraryArticles || []).filter((a) => !a.is_new);
        const newArticles = (libraryArticles || []).filter((a) => a.is_new);

        setArticleListCache({
            [filteredSubscription.domain]: savedArticles,
            new_feed: newArticles,
            // feed: pastArticles,
        });
    }, [feedArticles, libraryArticles]);

    if (!filteredSubscription) {
        return <></>;
    }

    const highlightColor = getRandomLightColor(filteredSubscription.domain, darkModeEnabled);
    const fallbackColor = darkModeEnabled ? "rgb(38 38 38)" : "rgb(245 245 244)";

    return (
        <div className="animate-fadein flex flex-col gap-4">
            <FeedHeader subscription={filteredSubscription} darkModeEnabled={darkModeEnabled} />

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
                            <svg className="h-4" viewBox="0 0 448 512">
                                <path
                                    fill="currentColor"
                                    d="M440.1 103C450.3 112.4 450.3 127.6 440.1 136.1L176.1 400.1C167.6 410.3 152.4 410.3 143 400.1L7.029 264.1C-2.343 255.6-2.343 240.4 7.029 231C16.4 221.7 31.6 221.7 40.97 231L160 350.1L407 103C416.4 93.66 431.6 93.66 440.1 103V103z"
                                />
                            </svg>
                        ) : (
                            <svg className="h-4" viewBox="0 0 448 512">
                                <path
                                    fill="currentColor"
                                    d="M432 256C432 269.3 421.3 280 408 280h-160v160c0 13.25-10.75 24.01-24 24.01S200 453.3 200 440v-160h-160c-13.25 0-24-10.74-24-23.99C16 242.8 26.75 232 40 232h160v-160c0-13.25 10.75-23.99 24-23.99S248 58.75 248 72v160h160C421.3 232 432 242.8 432 256z"
                                />
                            </svg>
                        )
                    }
                    color={!filteredSubscription.is_subscribed ? highlightColor : undefined}
                    onClick={() => {
                        rep?.mutate.toggleSubscriptionActive(filteredSubscription.id);
                        reportEvent(
                            !filteredSubscription.is_subscribed ? "followFeed" : "unfollowFeed",
                            {
                                source: "modal",
                                feedFrequencyWeek: this.libraryState.feed.post_frequency?.per_week,
                            }
                        );
                    }}
                />
            </div>

            <DraggableContext
                articleLists={articleListCache}
                setArticleLists={setArticleListCache}
                reportEvent={reportEvent}
            >
                <ArticleGroup
                    groupKey={filteredSubscription.domain}
                    title="Saved in library"
                    icon={
                        <svg className="h-4" viewBox="0 0 448 512">
                            <path
                                fill="currentColor"
                                d="M88 32C110.1 32 128 49.91 128 72V120C128 142.1 110.1 160 88 160H40C17.91 160 0 142.1 0 120V72C0 49.91 17.91 32 40 32H88zM88 72H40V120H88V72zM88 192C110.1 192 128 209.9 128 232V280C128 302.1 110.1 320 88 320H40C17.91 320 0 302.1 0 280V232C0 209.9 17.91 192 40 192H88zM88 232H40V280H88V232zM0 392C0 369.9 17.91 352 40 352H88C110.1 352 128 369.9 128 392V440C128 462.1 110.1 480 88 480H40C17.91 480 0 462.1 0 440V392zM40 440H88V392H40V440zM248 32C270.1 32 288 49.91 288 72V120C288 142.1 270.1 160 248 160H200C177.9 160 160 142.1 160 120V72C160 49.91 177.9 32 200 32H248zM248 72H200V120H248V72zM160 232C160 209.9 177.9 192 200 192H248C270.1 192 288 209.9 288 232V280C288 302.1 270.1 320 248 320H200C177.9 320 160 302.1 160 280V232zM200 280H248V232H200V280zM248 352C270.1 352 288 369.9 288 392V440C288 462.1 270.1 480 248 480H200C177.9 480 160 462.1 160 440V392C160 369.9 177.9 352 200 352H248zM248 392H200V440H248V392zM320 72C320 49.91 337.9 32 360 32H408C430.1 32 448 49.91 448 72V120C448 142.1 430.1 160 408 160H360C337.9 160 320 142.1 320 120V72zM360 120H408V72H360V120zM408 192C430.1 192 448 209.9 448 232V280C448 302.1 430.1 320 408 320H360C337.9 320 320 302.1 320 280V232C320 209.9 337.9 192 360 192H408zM408 232H360V280H408V232zM320 392C320 369.9 337.9 352 360 352H408C430.1 352 448 369.9 448 392V440C448 462.1 430.1 480 408 480H360C337.9 480 320 462.1 320 440V392zM360 440H408V392H360V440z"
                            />
                        </svg>
                    }
                    articles={articleListCache[filteredSubscription.domain]}
                    articleLines={Math.max(
                        1,
                        Math.ceil((articleListCache[filteredSubscription.domain]?.length || 0) / 5)
                    )}
                    color={highlightColor}
                    darkModeEnabled={darkModeEnabled}
                    reportEvent={reportEvent}
                />

                {filteredSubscription.is_subscribed && articleListCache["new_feed"] && (
                    <ArticleGroup
                        groupKey="new_feed"
                        title="New articles"
                        icon={
                            <svg className="h-4" viewBox="0 0 512 512">
                                <path
                                    fill="currentColor"
                                    d="M464 320h-96c-9.094 0-17.41 5.125-21.47 13.28L321.2 384H190.8l-25.38-50.72C161.4 325.1 153.1 320 144 320H32c-17.67 0-32 14.33-32 32v96c0 35.35 28.65 64 64 64h384c35.35 0 64-28.65 64-64v-80C512 341.5 490.5 320 464 320zM464 448c0 8.822-7.178 16-16 16H64c-8.822 0-16-7.178-16-16v-80h81.16l25.38 50.72C158.6 426.9 166.9 432 176 432h160c9.094 0 17.41-5.125 21.47-13.28L382.8 368H464V448zM238.4 312.3C242.1 317.2 249.3 320 256 320s13.03-2.781 17.59-7.656l104-112c9-9.719 8.438-24.91-1.25-33.94c-9.719-8.969-24.88-8.438-33.94 1.25L280 234.9V24c0-13.25-10.75-24-24-24S232 10.75 232 24v210.9L169.6 167.7C160.5 157.1 145.4 157.4 135.7 166.4C125.1 175.4 125.4 190.6 134.4 200.3L238.4 312.3z"
                                />
                            </svg>
                        }
                        articles={articleListCache["new_feed"]}
                        articleLines={1}
                        color={fallbackColor}
                        darkModeEnabled={darkModeEnabled}
                        reportEvent={reportEvent}
                        emptyMessage={`New articles from ${filteredSubscription.domain} will appear here.`}
                    />
                )}

                {/* {articleListCache["feed"] && (
                    <ArticleGroup
                        groupKey="feed"
                        title="Past articles"
                        icon={
                            <svg className="h-4" viewBox="0 0 448 512">
                                <path
                                    fill="currentColor"
                                    d="M152 64H296V24C296 10.75 306.7 0 320 0C333.3 0 344 10.75 344 24V64H384C419.3 64 448 92.65 448 128V448C448 483.3 419.3 512 384 512H64C28.65 512 0 483.3 0 448V128C0 92.65 28.65 64 64 64H104V24C104 10.75 114.7 0 128 0C141.3 0 152 10.75 152 24V64zM48 448C48 456.8 55.16 464 64 464H384C392.8 464 400 456.8 400 448V192H48V448z"
                                />
                            </svg>
                        }
                        articles={articleListCache["feed"]}
                        articleLines={Math.max(
                            1,
                            Math.min(5, Math.ceil(articleListCache["feed"].length / 5))
                        )}
                        color={fallbackColor}
                        darkModeEnabled={darkModeEnabled}
                        showProgress={false}
                        reportEvent={reportEvent}
                    />
                )} */}
            </DraggableContext>
        </div>
    );
}
