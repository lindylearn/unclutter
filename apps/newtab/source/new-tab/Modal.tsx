import {
    constructGraphData,
    CustomGraphData,
    LibraryModalPage,
} from "@unclutter/library-components/dist/components";
import {
    Article,
    ArticleLink,
    ReplicacheContext,
    UserInfo,
} from "@unclutter/library-components/dist/store";
import React, { useContext, useEffect, useState } from "react";

export default function NewTabModal({
    userInfo,
    darkModeEnabled,
    showModal,
    setShowModal,
}: {
    userInfo: UserInfo;
    darkModeEnabled: boolean;
    showModal: boolean | null;
    setShowModal: (showModal: boolean) => void;
}) {
    const rep = useContext(ReplicacheContext);
    const [graph, setGraph] = useState<CustomGraphData>();
    useEffect(() => {
        if (!rep) {
            return;
        }
        (async () => {
            await new Promise((resolve) => setTimeout(resolve, 200));

            const nodes: Article[] = await rep.query.listRecentArticles();
            const links: ArticleLink[] = await rep.query.listArticleLinks();

            const [graph, linkCount] = await constructGraphData(nodes, links);
            setGraph(graph);
        })();
    }, [rep]);

    // prevent initial fade-out animation
    if (showModal === null) {
        return <></>;
    }

    return (
        <LibraryModalPage
            userInfo={userInfo}
            darkModeEnabled={darkModeEnabled}
            showSignup={false}
            graph={graph}
            isVisible={showModal}
            closeModal={() => setShowModal(false)}
        />
    );
}
