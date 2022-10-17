import {
    LibraryModalPage,
    constructGraphData,
    CustomGraphData,
} from "@unclutter/library-components/dist/components";
import {
    Article,
    ArticleLink,
    ReplicacheContext,
    Topic,
    useSubscribe,
} from "@unclutter/library-components/dist/store";
import { useContext, useEffect, useState } from "react";

export default function ModalTestTab({}) {
    const articleId =
        "7e265e0ad2f1585e0268181143260537597756925ba18d05772322224a44ecb6";
    const [article, setArticle] = useState<Article>();
    const [topic, setTopic] = useState<Topic>();

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

            const article = await rep.query.getArticle(articleId);
            const topic = await rep.query.getTopic(article?.topic_id!);
            setArticle(article);
            setTopic(topic);

            const [graph, linkCount] = await constructGraphData(
                nodes,
                links,
                article?.url,
                topic
            );
            setGraph(graph);
        })();

        setTimeout(() => {
            setShowModal(true);
        }, 100);
    }, [rep]);

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

    const userInfo = useSubscribe(rep, rep?.subscribe.getUserInfo(), null);
    if (!userInfo) {
        return <></>;
    }

    return (
        <div className="h-screen w-screen">
            <div
                className="bg-lindy m-20 mx-auto max-w-md cursor-pointer rounded-lg p-2"
                onClick={() => setShowModal(true)}
            >
                Open Library
            </div>

            <LibraryModalPage
                userInfo={userInfo}
                darkModeEnabled={darkModeEnabled}
                showSignup={true}
                currentArticle={article?.url}
                initialTopic={topic}
                graph={graph}
                // relatedLinkCount={2}
                isVisible={showModal}
                closeModal={() => setShowModal(false)}
            />
        </div>
    );
}
