import {
    LibraryModalPage,
    getFullGraphData,
    CustomGraphData,
} from "@unclutter/library-components/dist/components";
import { ReplicacheContext } from "@unclutter/library-components/dist/store";
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
        getFullGraphData(rep, articleUrl).then(setGraph);

        setTimeout(() => {
            setShowModal(true);
        }, 100);
    }, []);

    const [darkModeEnabled, setDarkModeEnabled] = useState(false);
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
                isVisible={showModal}
                closeModal={() => setShowModal(false)}
            />
        </div>
    );
}
