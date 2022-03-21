import React from "react";
import {
    allowlistDomainOnManualActivationFeatureFlag,
    automaticallyEnabledFeatureFlag,
    collectAnonymousMetricsFeatureFlag,
} from "../common/defaultStorage";
import {
    getManualDomainLists,
    setAutomaticStatusForDomain,
} from "../common/storage";
import FeatureFlagSwitch from "./FeatureFlagSwitch";

function OptionsPage({}) {
    return (
        <div className="flex flex-col gap-3">
            <div>
                <h2 className="text-lg font-semibold mb-1">Global settings</h2>
                <FeatureFlagSwitch
                    featureFlagKey={automaticallyEnabledFeatureFlag}
                >
                    Automatically unclutter pages{" "}
                    <a
                        href=""
                        className="underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        that look like articles
                    </a>
                </FeatureFlagSwitch>
            </div>
            <div>
                <h2 className="text-lg font-semibold mb-1">
                    Website-specific settings
                </h2>
                <DomainList />
                <FeatureFlagSwitch
                    featureFlagKey={
                        allowlistDomainOnManualActivationFeatureFlag
                    }
                >
                    Add the current domain when clicking the extension icon
                </FeatureFlagSwitch>
                <p className="mt-1">
                    You can also change website-specific settings by clicking
                    the "bolt" icon next to each article.
                </p>
            </div>
            <div>
                <h2 className="text-lg font-bold mb-1">Other</h2>
                <FeatureFlagSwitch
                    featureFlagKey={collectAnonymousMetricsFeatureFlag}
                >
                    Collect anonymous{" "}
                    <a
                        href=""
                        className="underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        usage metrics
                    </a>
                </FeatureFlagSwitch>
            </div>

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
        setAutomaticStatusForDomain(domain, newStatus);
        // patch here to retain list order
        let updatedList;
        if (newStatus) {
            updatedList = overrideList.map(
                ({ domain: innerDomain, status }) => ({
                    domain: innerDomain,
                    status: innerDomain === domain ? newStatus : status,
                })
            );
        } else {
            updatedList = overrideList.filter(
                ({ domain: innerDomain }) => innerDomain !== domain
            );
        }

        setOverrideList(updatedList);
    }

    return (
        <>
            <p className="">
                Override the global settings for specific domains:
            </p>
            <ul className="ml-10 mt-2 mb-5 flex flex-col gap-1">
                {overrideList?.map(({ domain, status }) => (
                    <li className="flex gap-3 items-center">
                        <div className="underline w-32">
                            <a
                                href={`https://${domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {domain}
                            </a>
                        </div>
                        <select
                            value={status}
                            onChange={(e) =>
                                updateDomainStatus(domain, e.target.value)
                            }
                            className={
                                "p-1 " +
                                (status === "allow"
                                    ? "bg-green-300 dark:bg-green-500"
                                    : "bg-red-300 dark:bg-red-500")
                            }
                        >
                            <option value="allow" className="bg-white">
                                Always enabled
                            </option>
                            <option value="deny" className="bg-white">
                                Always disabled
                            </option>
                        </select>
                        <svg
                            className="text-gray-400 dark:text-white h-4 cursor-pointer"
                            viewBox="0 0 448 512"
                            onClick={() => updateDomainStatus(domain, null)}
                        >
                            <path
                                fill="currentColor"
                                d="M135.2 17.69C140.6 6.848 151.7 0 163.8 0H284.2C296.3 0 307.4 6.848 312.8 17.69L320 32H416C433.7 32 448 46.33 448 64C448 81.67 433.7 96 416 96H32C14.33 96 0 81.67 0 64C0 46.33 14.33 32 32 32H128L135.2 17.69zM394.8 466.1C393.2 492.3 372.3 512 346.9 512H101.1C75.75 512 54.77 492.3 53.19 466.1L31.1 128H416L394.8 466.1z"
                            />
                        </svg>
                    </li>
                ))}
            </ul>
        </>
    );
}
