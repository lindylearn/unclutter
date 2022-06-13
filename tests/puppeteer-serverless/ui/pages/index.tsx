import { useEffect, useRef, useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import { triggerScreenshots } from "../common/api";
import hnLinks from "../urls/hn.json";
import redditLinks from "../urls/reddit.json";

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

        await fetch("/api/syncExtensionCode");

        // delete previous state
        await Promise.all(
            currentScreenshots.concat(changedScreenshots).map(async (file) => {
                await fetch(
                    `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(
                        file.name
                    )}`,
                    {
                        method: "DELETE",
                        // headers: { Authorization: `Bearer ${gcsToken}` },
                    }
                );
            })
        );
        setCurrentScreenshots([]);
        setChangedScreenshots([]);

        // trigger new screenshots
        hnLinks;
        redditLinks;
        const urls = redditLinks.slice(0, countRef.current.value);
        await triggerScreenshots(urls, prefixRef.current.value, 10);

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
                <div className="text-2xl font-bold text-center">
                    Unclutter Screenshot Tester
                </div>
                <div className="flex gap-2 items-center">
                    <input
                        className="w-20 px-1 py-0.5 shadow rounded"
                        defaultValue={""}
                        placeholder="prefix"
                        ref={prefixRef}
                    />
                    <input
                        className="w-20 px-1 py-0.5 shadow rounded"
                        defaultValue={20}
                        ref={countRef}
                    />

                    <button
                        className="bg-yellow-400 rounded text-lg px-1 shadow hover:shadow-md transition-all"
                        onClick={trigger}
                    >
                        Trigger
                    </button>
                    <button
                        className="bg-yellow-400 rounded text-lg px-1 shadow hover:shadow-md transition-all"
                        onClick={fetchResults}
                    >
                        Fetch
                    </button>
                    <ClipLoader loading={isTriggering} size={20} />
                </div>
            </header>

            <main className="mt-5">
                <div>
                    <div className="text-lg ml-3 mb-3">
                        {changedScreenshots.length} Changed pages
                    </div>
                    <div className="flex flex-wrap gap-5">
                        {changedScreenshots.map((file) => (
                            <Screenshot key={file.md5Hash} {...file} />
                        ))}
                    </div>
                </div>

                <div>
                    <div className="text-lg ml-3 mb-3">
                        {currentScreenshots.length} Current pages
                    </div>
                    <div className="flex flex-wrap gap-5">
                        {currentScreenshots.map((file) => (
                            <Screenshot key={file.md5Hash} {...file} />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

function Screenshot({ name }) {
    const fileName = name.split("/")[2].split(".png")[0];
    const url = decodeURIComponent(fileName);

    return (
        <a
            className="cursor-pointer hover:shadow-xl transition-all"
            href={url}
            target="_blank"
        >
            <img
                className="w-72"
                src={`https://storage.cloud.google.com/unclutter-screenshots-serverless/${name.replaceAll(
                    "%",
                    "%25"
                )}`}
            />
        </a>
    );
}

export default Home;
