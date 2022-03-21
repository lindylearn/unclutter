import React from "react";
import {
    getAutomaticallyEnabled,
    getManualDomainLists,
    setAutomaticallyEnabled,
} from "../common/storage";
import Switch from "./Switch";

// there's a weird bundling error on firefox when importing React, {useState}
// so use React.useState

function OptionsPage({}) {
    const [automatic, setAutomatic] = React.useState(null);
    React.useEffect(async () => {
        const state = await getAutomaticallyEnabled();
        setAutomatic(state);
    }, []);
    function toggleAutomaticLocalFirst() {
        setAutomatic(!automatic);
        setAutomaticallyEnabled(!automatic);
    }

    const [domainLists, setDomainLists] = React.useState(null);
    React.useEffect(async () => {
        const lists = await getManualDomainLists();
        setDomainLists(lists);
    }, []);

    return (
        <div className="flex flex-col gap-3">
            <div className="text-base flex">
                <div className="mr-3">Automatically unclutter articles</div>{" "}
                <Switch
                    id="automatic"
                    state={automatic}
                    toggle={toggleAutomaticLocalFirst}
                />
            </div>
            <ManualList
                status="Manually enabled"
                list={domainLists?.allow || []}
            />
            <ManualList status="Disabled" list={domainLists?.deny || []} />

            <div className="text-xs text-right text-gray-400">
                Please report issues{" "}
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
