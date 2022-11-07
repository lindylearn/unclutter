import ky from "ky";
import { useEffect, useState } from "react";

export default function FeedTest({}) {
    const [url, setUrl] = useState("");
    async function fetchFeed() {
        const response = await ky
            .get("/api/feed/discover", {
                searchParams: {
                    url,
                },
            })
            .json();

        console.log(response);
    }
    useEffect(() => {}, []);

    return (
        <div className="m-20 flex gap-5">
            <input
                className="w-80 bg-stone-200 text-lg outline-none"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
            />
            <button className="bg-stone-200" onClick={fetchFeed}>
                Fetch
            </button>
        </div>
    );
}
