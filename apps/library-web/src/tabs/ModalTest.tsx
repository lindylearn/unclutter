import {
    LibraryModalPage,
    constructGraphData,
    CustomGraphData,
} from "@unclutter/library-components/dist/components";
import {
    Article,
    ArticleLink,
    ReplicacheContext,
} from "@unclutter/library-components/dist/store";
import { useContext, useEffect, useState } from "react";

export default function ModalTestTab({}) {
    const articleUrl = "https://developer.chrome.com/blog/mv2-transition/";

    const rep = useContext(ReplicacheContext);
    const [graph, setGraph] = useState<CustomGraphData>();
    const [showModal, setShowModal] = useState(false);
    useEffect(() => {
        if (!rep) {
            return;
        }
        (async () => {
            const nodes: Article[] = await rep.query.listRecentArticles();
            const links: ArticleLink[] = await rep.query.listArticleLinks();

            const graph = await constructGraphData(nodes, links, articleUrl);
            setGraph(graph);
        })();

        setTimeout(() => {
            setShowModal(true);
        }, 100);
    }, []);

    const [darkModeEnabled, setDarkModeEnabled] = useState(
        window.matchMedia("(prefers-color-scheme: dark)").matches
    );
    useEffect(() => {
        window
            .matchMedia("(prefers-color-scheme: dark)")
            .addEventListener("change", (event) => {
                setDarkModeEnabled(event.matches);
            });
    }, []);

    return (
        <div className="h-screen w-screen">
            <div
                className="bg-lindy m-20 mx-auto max-w-md cursor-pointer rounded-lg p-2"
                onClick={() => setShowModal(true)}
            >
                Open Library
            </div>

            <LibraryModalPage
                darkModeEnabled={darkModeEnabled}
                articleUrl={articleUrl}
                graph={graph}
                new_link_count={2}
                isVisible={showModal}
                closeModal={() => setShowModal(false)}
            />
        </div>
    );
}
