import React, { useLayoutEffect, useRef } from "react";
import { setUserSettingsForDomain } from "../common/storage";
import { getAllCustomDomainSettings } from "../common/storage2";
import { reportEventContentScript } from "@unclutter/library-components/dist/common/messaging";

export default function DomainSettingsList({}) {
    const [overrideList, setOverrideList] = React.useState(null);
    React.useEffect(() => {
        (async function () {
            const customSettings = await getAllCustomDomainSettings();

            const allowedDomains = customSettings.allow.map((domain) => ({
                domain,
                status: "allow",
            }));
            const blockedDomains = customSettings.deny.map((domain) => ({
                domain,
                status: "deny",
            }));

            const completeList = allowedDomains.concat(blockedDomains).map((obj) => ({
                ...obj,
            }));

            setOverrideList(completeList);
        })();
    }, []);

    function updateDomainStatus(domain, newStatus) {
        // save in storage
        setUserSettingsForDomain(domain, newStatus);

        // Patch locally to retain current list order
        const updatedList = overrideList.map(({ domain: innerDomain, status, ...rest }) => ({
            ...rest,
            domain: innerDomain,
            status: innerDomain === domain ? newStatus : status,
        }));

        reportEventContentScript("changeDomainSetting", {
            newState: newStatus,
            trigger: "settings-page",
        });

        setOverrideList(updatedList);
    }
    function deleteDomainSettings(domain) {
        setUserSettingsForDomain(domain, null);

        const updatedList = overrideList.filter(
            ({ domain: innerDomain }) => innerDomain !== domain
        );
        setOverrideList(updatedList);

        reportEventContentScript("changeDomainSetting", {
            newState: null,
            trigger: "settings-page",
        });
    }

    const [adderDomain, setAdderDomain] = React.useState("");
    const [adderStatus, setAdderStatus] = React.useState("allow");
    function addDomain() {
        if (!adderDomain || !adderDomain.includes(".") || !adderStatus) {
            return;
        }

        setUserSettingsForDomain(adderDomain, adderStatus);
        const updatedList = overrideList.concat([
            {
                domain: adderDomain,
                status: adderStatus,
            },
        ]);
        setAdderDomain("");
        setOverrideList(updatedList);

        reportEventContentScript("changeDomainSetting", {
            newState: adderStatus,
            trigger: "settings-page-add",
        });
    }
    useLayoutEffect(() => {
        listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [adderDomain === ""]);

    const listRef = useRef();

    return (
        <div className="mt-1">
            <ul
                className="flex h-40 flex-col items-stretch gap-1 overflow-y-auto px-3 py-2 shadow-inner"
                style={{ background: "var(--embedded-background)" }}
                ref={listRef}
            >
                {overrideList?.length === 0 && (
                    <li className="text-gray-500 dark:text-gray-300">
                        There are no automatic activation settings yet!
                    </li>
                )}
                {overrideList?.map(({ domain, status }) => (
                    <li className="flex items-center justify-between gap-3">
                        <div className="flex-grow underline">
                            <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer">
                                {domain}
                            </a>
                        </div>

                        <select
                            value={status}
                            onChange={(e) => updateDomainStatus(domain, e.target.value)}
                            className={
                                "rounded-sm p-1 outline-none " + getDomainStatusStyle(status)
                            }
                        >
                            <option value="allow" className="bg-white">
                                Always unclutter
                            </option>
                            <option value="deny" className="bg-white">
                                Never unclutter
                            </option>
                        </select>

                        <svg
                            className="h-4 w-4 cursor-pointer opacity-50 dark:text-white"
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
                <div className="flex-grow"></div>
                <div className="mt-0 flex w-full items-center justify-between gap-3">
                    <input
                        placeholder="Enter a new domain..."
                        className="-ml-1 flex-grow rounded-sm px-1 py-0.5 outline-none"
                        value={adderDomain}
                        onChange={(e) => setAdderDomain(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                addDomain();
                            }
                        }}
                    />
                    <select
                        value={adderStatus}
                        onChange={(e) => setAdderStatus(e.target.value)}
                        className={
                            "rounded-sm p-1 outline-none " + getDomainStatusStyle(adderStatus)
                        }
                    >
                        <option value="allow" className="bg-white">
                            Always unclutter
                        </option>
                        <option value="deny" className="bg-white">
                            Never unclutter
                        </option>
                    </select>
                    <div className="h-4 w-4" onClick={addDomain}>
                        <svg
                            className="h-4 w-4 origin-center scale-125 cursor-pointer opacity-50 dark:text-white"
                            viewBox="0 0 448 512"
                        >
                            <path
                                fill="currentColor"
                                d="M432 256c0 17.69-14.33 32.01-32 32.01H256v144c0 17.69-14.33 31.99-32 31.99s-32-14.3-32-31.99v-144H48c-17.67 0-32-14.32-32-32.01s14.33-31.99 32-31.99H192v-144c0-17.69 14.33-32.01 32-32.01s32 14.32 32 32.01v144h144C417.7 224 432 238.3 432 256z"
                            />
                        </svg>
                    </div>
                </div>
            </ul>
        </div>
    );
}

export function getDomainStatusStyle(status) {
    if (status === "allow") {
        return "bg-green-300 dark:bg-green-500";
    } else if (status === "deny") {
        return "bg-red-300 dark:bg-red-500";
    }
    return "";
}
