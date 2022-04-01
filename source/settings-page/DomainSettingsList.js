import React from "react";
import {
    getAllCustomDomainSettings,
    setUserSettingsForDomain,
} from "../common/storage";

export default function DomainSettingsList({}) {
    const [overrideList, setOverrideList] = React.useState(null);
    React.useEffect(async () => {
        const customSettings = await getAllCustomDomainSettings();

        const allowedDomains = customSettings.allow.map((domain) => ({
            domain,
            status: "allow",
        }));
        const blockedDomains = customSettings.deny.map((domain) => ({
            domain,
            status: "deny",
        }));

        const completeList = allowedDomains
            .concat(blockedDomains)
            .map((obj) => ({
                ...obj,
            }));

        setOverrideList(completeList);
    }, []);

    function updateDomainStatus(domain, newStatus) {
        setUserSettingsForDomain(domain, newStatus);

        // Patch locally to retain current list order
        const updatedList = overrideList.map(
            ({ domain: innerDomain, status, ...rest }) => ({
                ...rest,
                domain: innerDomain,
                status: innerDomain === domain ? newStatus : status,
            })
        );

        setOverrideList(updatedList);
    }
    function deleteDomainSettings(domain) {
        setUserSettingsForDomain(domain, null);

        const updatedList = overrideList.filter(
            ({ domain: innerDomain }) => innerDomain !== domain
        );

        setOverrideList(updatedList);
    }

    return (
        <>
            <p className="">
                Override the global settings for specific website domains:
            </p>
            <ul className="mx-10 mt-2 mb-5 flex flex-col gap-1">
                {overrideList?.map(({ domain, status }) => (
                    <li className="flex gap-5 items-center">
                        <div className="underline w-44">
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
                            className={"p-1 " + _getDomainStatusStyle(status)}
                        >
                            <option value={null} className="bg-white">
                                No preference
                            </option>
                            <option value="allow" className="bg-white">
                                Enable extension
                            </option>
                            <option value="deny" className="bg-white">
                                Disable extension
                            </option>
                        </select>

                        {/* <div className="flex-grow" /> */}

                        <svg
                            className="text-gray-400 dark:text-white h-4 cursor-pointer"
                            viewBox="0 0 448 512"
                            onClick={() => deleteDomainSettings(domain)}
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

function _getDomainStatusStyle(status) {
    if (status === "allow") {
        return "bg-green-300 dark:bg-green-500";
    } else if (status === "deny") {
        return "bg-red-300 dark:bg-red-500";
    }
    return "";
}
