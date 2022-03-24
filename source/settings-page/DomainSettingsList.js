import React from "react";
import {
    deleteDomainUserTheme,
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

        const seenDomains = new Set([
            ...customSettings.allow,
            ...customSettings.deny,
        ]);
        const themedDomains = Object.keys(customSettings.themes)
            .filter((domain) => !seenDomains.has(domain))
            .map((domain) => ({ domain, status: null }));

        const completeList = themedDomains
            .concat(allowedDomains)
            .concat(blockedDomains)
            .map((obj) => ({
                ...obj,
                theme: customSettings.themes[obj.domain],
            }));

        console.log(completeList);

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
        deleteDomainUserTheme(domain);

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
            <ul className="mx-5 mt-2 mb-5 flex flex-col gap-1">
                {overrideList?.map(({ domain, status, theme }) => (
                    <li className="flex gap-3 items-center">
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

                        <div>
                            {theme && <div>Custom theme</div>}
                            {/* <svg class="w-5 inline mr-2" viewBox="0 0 640 512">
                                <path
                                    fill="currentColor"
                                    d="M205.1 52.76C201.3 40.3 189.3 32.01 176 32.01S150.7 40.3 146 52.76l-144 384c-6.203 16.56 2.188 35 18.73 41.22c16.55 6.125 34.98-2.156 41.2-18.72l28.21-75.25h171.6l28.21 75.25C294.9 472.1 307 480 320 480c3.734 0 7.531-.6562 11.23-2.031c16.55-6.219 24.94-24.66 18.73-41.22L205.1 52.76zM114.2 320L176 155.1l61.82 164.9H114.2zM608 160c-13.14 0-24.37 7.943-29.3 19.27C559.2 167.3 536.5 160 512 160c-70.58 0-128 57.41-128 128l.0007 63.93c0 70.59 57.42 128.1 127.1 128.1c24.51 0 47.21-7.266 66.7-19.26C583.6 472.1 594.9 480 608 480c17.67 0 32-14.31 32-32V192C640 174.3 625.7 160 608 160zM576 352c0 35.28-28.7 64-64 64s-64-28.72-64-64v-64c0-35.28 28.7-63.1 64-63.1s64 28.72 64 63.1V352z"
                                />
                            </svg> */}
                        </div>

                        <div className="flex-grow" />

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
