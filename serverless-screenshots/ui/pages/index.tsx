import { useEffect, useRef, useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import { triggerScreenshots } from "../common/api";
import hnLinks from "../urls/hn.json";
import infeatherLinks from "../urls/infeather.json";
import recentHnLinks from "../urls/recent_hn_annotations.json";
import redditLinks from "../urls/reddit.json";
import topHnLinks from "../urls/top_hn_annotations.json";
import articles from "../urls/articles.json";

const gcsToken = "";
const bucketName = "unclutter-screenshots-serverless";

function Home() {
    const countRef = useRef();
    const prefixRef = useRef();

    const [isTriggering, setIsTriggering] = useState(false);
    const [currentScreenshots, setCurrentScreenshots] = useState([]);
    const [changedScreenshots, setChangedScreenshots] = useState([]);
    useEffect(() => {
        if (isTriggering) {
            // fetch pages only once triggering done
            return;
        }

        (async () => {
            const response1 = await fetch(
                `https://storage.googleapis.com/storage/v1/b/${bucketName}/o?prefix=${prefixRef.current.value}/current`
                // { headers: { Authorization: `Bearer ${gcsToken}` } }
            );
            const responseData1 = await response1.json();
            setCurrentScreenshots(responseData1.items || []);

            const response2 = await fetch(
                `https://storage.googleapis.com/storage/v1/b/${bucketName}/o?prefix=${prefixRef.current.value}/diff`
                // { headers: { Authorization: `Bearer ${gcsToken}` } }
            );
            const responseData2 = await response2.json();
            setChangedScreenshots(responseData2.items || []);
        })();
    }, [isTriggering]);

    async function trigger() {
        setIsTriggering(true);

        // await fetch("/api/syncExtensionCode");

        // delete previous state
        // await Promise.all(
        //     currentScreenshots.concat(changedScreenshots).map(async (file) => {
        //         await fetch(
        //             `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(
        //                 file.name
        //             )}`,
        //             {
        //                 method: "DELETE",
        //                 // headers: { Authorization: `Bearer ${gcsToken}` },
        //             }
        //         );
        //     })
        // );
        setCurrentScreenshots([]);
        setChangedScreenshots([]);

        // trigger new screenshots
        let urls;
        if (prefixRef.current.value === "hn") {
            urls = hnLinks;
        } else if (prefixRef.current.value === "reddit") {
            urls = redditLinks;
        } else if (prefixRef.current.value === "top_hn") {
            urls = topHnLinks;
        } else if (prefixRef.current.value === "recent_hn") {
            urls = recentHnLinks;
        } else if (prefixRef.current.value === "infeather") {
            urls = infeatherLinks;
        } else if (prefixRef.current.value === "articles") {
            urls = articles.slice(3000).map((topic) => topic.url);
        }

        await triggerScreenshots(
            urls.slice(0, countRef.current.value),
            prefixRef.current.value,
            10
        );

        setIsTriggering(false);
    }
    function fetchResults() {
        setIsTriggering(true);
        setTimeout(() => {
            setIsTriggering(false);
        }, 100);
    }

    return (
        <div className="">
            <header className="mt-5 flex items-center justify-center gap-5">
                <div className="text-center text-2xl font-bold">
                    Unclutter Screenshot Tester
                </div>
                <div className="flex items-center gap-2">
                    <input
                        className="w-20 rounded px-1 py-0.5 shadow"
                        defaultValue={""}
                        placeholder="prefix"
                        ref={prefixRef}
                    />
                    <input
                        className="w-20 rounded px-1 py-0.5 shadow"
                        defaultValue={20}
                        ref={countRef}
                    />

                    <button
                        className="rounded bg-yellow-400 px-1 text-lg shadow transition-all hover:shadow-md"
                        onClick={trigger}
                    >
                        Trigger
                    </button>
                    <button
                        className="rounded bg-yellow-400 px-1 text-lg shadow transition-all hover:shadow-md"
                        onClick={fetchResults}
                    >
                        Fetch
                    </button>
                    <ClipLoader loading={isTriggering} size={20} />
                </div>
            </header>

            <main className="mt-5">
                <div>
                    <div className="ml-3 mb-3 text-lg">
                        {changedScreenshots.length} Changed pages
                    </div>
                    <div className="flex flex-wrap gap-5">
                        {changedScreenshots.map((file) => (
                            <Screenshot key={file.id} {...file} />
                        ))}
                    </div>
                </div>

                <div>
                    <div className="ml-3 mb-3 text-lg">
                        {currentScreenshots.length} Current pages
                    </div>
                    <div className="flex flex-wrap gap-5">
                        {currentScreenshots.map((file) => (
                            <Screenshot key={file.id} {...file} />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

function Screenshot({ name }) {
    const fileName = name.split("/")[2].split(".webp")[0];
    const url = decodeURIComponent(fileName);

    return (
        <a
            className="cursor-pointer transition-all hover:shadow-xl"
            href={url}
            target="_blank"
        >
            <img
                className="w-72"
                src={`https://storage.googleapis.com/unclutter-screenshots-serverless/${name.replaceAll(
                    "%",
                    "%25"
                )}`}
            />
        </a>
    );
}

export default Home;
