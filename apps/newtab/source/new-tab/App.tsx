import React, {
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useState,
} from "react";
import {
    LindyIcon,
    TabbedContainer,
    useTabInfos,
    useArticleListsCache,
    StaticArticleList,
    getActivityColor,
    ReadingProgress,
    DraggableArticleList,
    DraggableContext,
    ArticleListsCache,
} from "@unclutter/library-components/dist/components";
import {
    Article,
    readingProgressFullClamp,
    ReplicacheContext,
    UserInfo,
} from "@unclutter/library-components/dist/store";
import {
    reportEventContentScript,
    ReplicacheProxy,
    getUnclutterExtensionId,
} from "@unclutter/library-components/dist/common";

import { settingsStore, useSettings } from "../common/settings";

import "@unclutter/library-components/styles/globals.css";
import "@unclutter/library-components/styles/ArticlePreview.css";
import "@unclutter/library-components/styles/ProgressCircle.css";
import "./app.css";
import clsx from "clsx";

export default function App() {
    // send messages to main Unclutter extension directly by passing its id
    const rep = useMemo<ReplicacheProxy>(
        () => new ReplicacheProxy(getUnclutterExtensionId()),
        []
    );

    const [userInfo, setUserInfo] = useState<UserInfo>();
    useEffect(() => {
        rep.query.getUserInfo().then(setUserInfo);
    });
    if (!userInfo) {
        return <></>;
    }

    return (
        // @ts-ignore
        <ReplicacheContext.Provider value={rep}>
            <ArticleSection userInfo={userInfo} />
        </ReplicacheContext.Provider>
    );
}

function ArticleSection({
    userInfo,
    articleLines = 1,
}: {
    userInfo: UserInfo;
    articleLines?: number;
}) {
    // const tabInfos = useTabInfos(10, true, false, null, userInfo);
    // const [articleListsCache, setArticleListsCache] =
    //     useArticleListsCache(tabInfos);

    // const settings = useSettings(settingsStore);
    // const [initialIndex, setInitialIndex] = useState<number | null>();
    // useLayoutEffect(() => {
    //     if (tabInfos && settings) {
    //         if (settings.newtabActiveGroupKey === null) {
    //             setInitialIndex(null);
    //             return;
    //         }
    //         const index = tabInfos?.findIndex(
    //             (tab) => tab.key === settings.newtabActiveGroupKey
    //         );
    //         if (tabInfos[index]) {
    //             setInitialIndex(index);
    //         } else {
    //             setInitialIndex(0);
    //         }
    //     }
    // }, [tabInfos, settings]);

    const rep = useContext(ReplicacheContext);

    const [queuedArticles, setQueuedArticles] = useState<Article[]>([]);
    let [articleListsCache, setArticleListsCache] =
        useState<ArticleListsCache>();
    useEffect(() => {
        (async () => {
            const queuedArticles = await rep.query.listQueueArticles();
            setQueuedArticles(queuedArticles);
            setArticleListsCache({ queue: queuedArticles });
        })();
    }, [rep]);

    const readCount = queuedArticles?.filter(
        (a) => a.reading_progress >= readingProgressFullClamp
    )?.length;

    function reportEvent(...args: any[]) {
        reportEventContentScript(...args, getUnclutterExtensionId());
    }

    const color = getActivityColor(1, false);

    return (
        <div className="font-text text-base">
            <div className="mb-2 flex justify-end gap-3">
                <ReadingProgress
                    className="cursor-pointer rounded-lg px-2 py-1 hover:scale-[97%] hover:bg-stone-100"
                    articleCount={queuedArticles.length}
                    readCount={readCount}
                    color={color}
                />
            </div>
            <div
                className="topic-articles animate-fadein relative rounded-lg p-3"
                style={{
                    height: `${
                        11.5 * articleLines - 0.75 * (articleLines - 1)
                    }rem`, // article height + padding to prevent size change
                    background: color,
                }}
            >
                <DraggableContext
                    articleLists={articleListsCache}
                    setArticleLists={setArticleListsCache}
                    reportEvent={reportEvent}
                >
                    {queuedArticles.length > 0 && (
                        <DraggableArticleList
                            listId="queue"
                            articlesToShow={6 * articleLines}
                            small
                            reportEvent={reportEvent}
                        />
                    )}
                </DraggableContext>
            </div>
        </div>
    );
}
