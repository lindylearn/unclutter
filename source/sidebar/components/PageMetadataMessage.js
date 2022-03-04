import browser from "webextension-polyfill";
import { useEffect, useState } from "react";
import { format as formatRelativeTime } from "timeago.js";

export default function PageMetadataMessage({ url }) {
    const [visits, setVisits] = useState(null);
    useEffect(async () => {
        const visits = await browser.history.getVisits({ url });
        setVisits(visits);
    }, []);

    return (
        <div className="">
            {/* <div>{url}</div> */}
            {visits && (
                <div className="text-sm">
                    Visited {visits.length} times, first{" "}
                    {formatRelativeTime(new Date(visits[0].visitTime))}
                </div>
            )}
        </div>
    );
}
