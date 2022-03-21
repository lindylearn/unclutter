import React from "react";
import {
    getAutomaticallyEnabled,
    getManualDomainLists,
    setAutomaticallyEnabled,
    setAutomaticStatusForDomain,
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

    return (
        <div className="flex flex-col gap-5">
            <div>
                <h2 className="text-lg font-semibold">Global settings</h2>
                <Switch
                    id="automatic"
                    text="Automatically unclutter articles"
                    state={automatic}
                    toggle={toggleAutomaticLocalFirst}
                />
            </div>
            <div>
                <h2 className="text-lg font-semibold">
                    Website-specific settings
                </h2>
                <DomainList />
            </div>
            {/* <div>
                <h2 className="text-lg font-bold">Other</h2>
                <Switch
                    id="metrics"
                    text="Collect anonymous <a href='' className='underline'>usage metrics</a>"
                    // state={automatic}
                    // toggle={toggleAutomaticLocalFirst}
                />
            </div> */}

            <div className="text-right text-gray-400 mt-5">
                This extension is open source! Post issues and feature ideas{" "}
                <a
                    href="https://github.com/lindylearn/unclutter"
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

function DomainList({}) {
    const [overrideList, setOverrideList] = React.useState(null);
    React.useEffect(async () => {
        const lists = await getManualDomainLists();
        const completeList = lists.allow
            .map((domain) => ({ domain, status: "allow" }))
            .concat(lists.deny.map((domain) => ({ domain, status: "deny" })));

        setOverrideList(completeList);
    }, []);

    function updateDomainStatus(domain, newStatus) {
        setAutomaticStatusForDomain(domain, newStatus === "allow");
        // patch here to retain list order
        const updatedList = overrideList.map(
            ({ domain: innerDomain, status }) => ({
                domain: innerDomain,
                status: innerDomain === domain ? newStatus : status,
            })
        );
        setOverrideList(updatedList);
    }

    return (
        <>
            <p className="">
                Above global settings are overriden for {overrideList?.length}{" "}
                domain{overrideList?.length !== 1 ? "s" : ""}:
            </p>
            <ul className="ml-10 pt-2 flex flex-col gap-1">
                {overrideList?.map(({ domain, status }) => (
                    <li className="flex gap-5">
                        <a
                            className="underline w-52"
                            href={`https://${domain}`}
                        >
                            {domain}
                        </a>
                        <select
                            value={status}
                            onChange={(e) =>
                                updateDomainStatus(domain, e.target.value)
                            }
                            className={
                                "p-1 " +
                                (status === "allow"
                                    ? "bg-green-300"
                                    : "bg-red-300")
                            }
                        >
                            <option value="allow" className="bg-white">
                                Enabled
                            </option>
                            <option value="deny" className="bg-white">
                                Disabled
                            </option>
                        </select>
                    </li>
                ))}
            </ul>
        </>
    );
}
