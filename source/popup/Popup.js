import React, { useEffect, useState } from "react";
import {
    getAutomaticallyEnabled,
    getManualDomainLists,
    setAutomaticallyEnabled,
} from "../common/storage";
import Switch from "./Switch";

function OptionsPage({}) {
    // const [currentTab, setCurrentTab] = useState(null);
    // const [currentDomain, setCurrentDomain] = useState(null);
    // useEffect(async () => {
    //     const tabs = await browser.tabs.query({
    //         active: true,
    //         currentWindow: true,
    //     });
    //     setCurrentTab(tabs[0]);

    //     const url = new URL(tabs[0]?.url);
    //     const hostname = url.hostname.replace("www.", "");
    //     setCurrentDomain(hostname);
    // }, []);

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
        <div className="flex flex-col gap-3 text-gray-700">
            {/* <div className="text-base flex justify-between align-middle">
                    <div>
                        Automatically unclutter{" "}
                        <span className="font-mono">{currentDomain}</span>
                    </div>

                    <Switch />
                </div> */}
            <div className="text-base flex">
                <div className="mr-3">Automatically unclutter articles</div>{" "}
                <Switch
                    id="automatic"
                    state={automatic}
                    toggle={toggleAutomaticLocalFirst}
                />
            </div>
            {automatic === false && (
                <ManualList status="Enabled" list={domainLists?.allow || []} />
            )}
            {automatic && (
                <ManualList status="Disabled" list={domainLists?.deny || []} />
            )}

            <div className="text-xs text-right text-gray-400">
                Report issues{" "}
                <a
                    href="https://github.com/lindylearn/reader-extension"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                >
                    on GitHub
                </a>
                .
            </div>
        </div>
    );
}
export default OptionsPage;

function ManualList({ status, list, maxCount = 4 }) {
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
                                <span className="font-mono">{domain}</span>
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
