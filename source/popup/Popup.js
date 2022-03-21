import React, { useEffect, useState } from "react";
import {
    getAutomaticallyEnabled,
    getManualDomainLists,
    setAutomaticallyEnabled,
} from "../common/storage";
import Switch from "./Switch";

function OptionsPage({}) {
    const [automatic, setAutomatic] = useState(null);
    useEffect(async () => {
        const state = await getAutomaticallyEnabled();
        setAutomatic(state);
    }, []);
    function toggleAutomaticLocalFirst() {
        setAutomatic(!automatic);
        setAutomaticallyEnabled(!automatic);
    }

    const [domainLists, setDomainLists] = useState(null);
    useEffect(async () => {
        const lists = await getManualDomainLists();
        setDomainLists(lists);
    }, []);

    return (
        <div
            className="flex flex-col gap-3"
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
            }}
        >
            {/* <div className="text-base flex justify-between align-middle">
                    <div>
                        Automatically unclutter{" "}
                        <span className="font-mono">{currentDomain}</span>
                    </div>

                    <Switch />
                </div> */}
            <div
                className="text-base flex"
                style={{ fontSize: "medium", display: "flex" }}
            >
                <div className="mr-3" style={{ marginRight: "5px" }}>
                    Automatically unclutter articles
                </div>{" "}
                <Switch
                    id="automatic"
                    state={automatic}
                    toggle={toggleAutomaticLocalFirst}
                />
            </div>
            {automatic === false && (
                <ManualList
                    status="Manually enabled"
                    list={domainLists?.allow || []}
                />
            )}
            {automatic && (
                <ManualList status="Disabled" list={domainLists?.deny || []} />
            )}

            <div
                className="text-xs text-right text-gray-400"
                style={{
                    fontSize: "small",
                    color: "#9ca3af",
                    textAlign: "right",
                }}
            >
                Report issues{" "}
                <a
                    href="https://github.com/lindylearn/reader-extension"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    style={{ color: "#9ca3af" }}
                >
                    on GitHub
                </a>
                .
            </div>
        </div>
    );
}
export default OptionsPage;

function ManualList({ status, list, maxCount = 3 }) {
    return (
        <div className="text-base">
            {status} on {list.length} domain
            {list.length !== 1 ? "s" : ""}
            {list.length > 0 && (
                <>
                    {" "}
                    including
                    <div>
                        {list.slice(0, maxCount).map((domain, i) => (
                            <>
                                <span
                                    className="font-mono"
                                    style={{ fontFamily: "monospace" }}
                                >
                                    {domain}
                                </span>
                                {i < Math.min(list.length, maxCount) - 1
                                    ? ", "
                                    : ""}
                            </>
                        ))}
                        {list.length > maxCount && ", ..."}
                    </div>
                </>
            )}
        </div>
    );
}
