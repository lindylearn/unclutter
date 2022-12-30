import React, { useEffect, useState } from "react";
import { getPageReportCount } from "../common/storage";
import { getAllElementBlockSelectors } from "../common/storage2";

export default function ContributionStats() {
    const [reportCount, setReportCount] = useState(0);
    const [selectorCount, setSelectorCount] = useState(0);
    useEffect(() => {
        (async function () {
            const count = await getPageReportCount();
            setReportCount(count);

            const selectors = await getAllElementBlockSelectors();
            setSelectorCount(selectors.length);
        })();
    }, []);

    return (
        <div className="">
            You reported {reportCount} broken article
            {reportCount !== 1 ? "s" : ""} and submitted {selectorCount} annoyances{" "}
            <a
                href="https://github.com/lindylearn/unclutter/tree/main/docs/element-blocking.md"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
            >
                block selector{selectorCount !== 1 ? "s" : ""}
            </a>
            .{reportCount + selectorCount > 0 && <span> Thank you! </span>}
        </div>
    );
}
