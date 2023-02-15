import { useAutoDarkMode } from "@unclutter/library-components/dist/common";
import {
    LibraryModalPage,
    constructGraphData,
    CustomGraphData,
    SignupModalPage,
} from "@unclutter/library-components/dist/components";
import { ModalVisibilityContext } from "@unclutter/library-components/dist/components/Modal/context";
import {
    Article,
    ArticleLink,
    ReplicacheContext,
    Topic,
    useSubscribe,
} from "@unclutter/library-components/dist/store";
import { useContext, useEffect, useState } from "react";

export default function ModalTestTab({}) {
    const articleId = "7e265e0ad2f1585e0268181143260537597756925ba18d05772322224a44ecb6";
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

            const [graph, linkCount] = await constructGraphData(nodes, links, article?.url, topic);
            setGraph(graph);
        })();

        setTimeout(() => {
            setShowModal(true);
        }, 100);
    }, [rep]);

    const darkModeEnabled = useAutoDarkMode();

    const userInfo = useSubscribe(rep, rep?.subscribe.getUserInfo(), null);
    if (userInfo) {
        userInfo.accountEnabled = false;
        userInfo.aiEnabled = false;
    }

    if (!userInfo) {
        return <></>;
    }

    // return (
    //     <ModalVisibilityContext.Provider
    //         value={{ isVisible: showModal, closeModal: () => setShowModal(false) }}
    //     >
    //         <SignupModalPage />
    //     </ModalVisibilityContext.Provider>
    // );

    return (
        <div className="h-screen w-screen p-1">
            <div
                className="bg-lindy m-20 mx-auto max-w-md cursor-pointer rounded-lg p-2"
                onClick={() => setShowModal(true)}
            >
                Open Library
            </div>

            <ModalVisibilityContext.Provider
                value={{ isVisible: showModal, closeModal: () => setShowModal(false) }}
            >
                <LibraryModalPage
                    userInfo={userInfo}
                    darkModeEnabled={darkModeEnabled}
                    showSignup={true}
                    // currentArticle={article?.url}
                    initialTopic={topic}
                    // relatedLinkCount={2}
                />
            </ModalVisibilityContext.Provider>
        </div>
    );
}
