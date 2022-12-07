import clsx from "clsx";
import React, { ReactNode } from "react";
import { getRandomLightColor } from "../../../common";

export default function SyncModalTab({
    darkModeEnabled,
    reportEvent = () => {},
}: {
    darkModeEnabled: boolean;
    reportEvent?: (event: string, data?: any) => void;
}) {
    // const [hypothesisEnabled, setHypothesisEnabled] = React.useState(null);
    // React.useEffect(() => {
    //     (async function () {
    //         const enabled = await getFeatureFlag(hypothesisSyncFeatureFlag);
    //         setHypothesisEnabled(enabled);
    //     })();
    // }, []);
    // function onChangeHypothesisSync(enabled) {
    //     setHypothesisEnabled(enabled);
    // }

    return (
        <div className="flex min-h-full flex-col gap-4">
            <div className="grid list-disc grid-cols-2 gap-4">
                {Object.entries(importOptions).map(([id, option]) => (
                    <div
                        key={id}
                        className={clsx(
                            "rounded-md bg-stone-50 p-3 transition-transform hover:scale-[99%] dark:bg-neutral-800",
                            option.backgroundColor
                        )}
                    >
                        <h2 className="mb-3 flex items-center gap-2 px-1 font-medium">
                            <img
                                className="mr-2 inline-block h-5 w-5"
                                src={`https://unclutter.lindylearn.io/logos/${option.iconFile}`}
                            />
                            {option.name}
                        </h2>

                        <div className="flex h-32 flex-col justify-between gap-2 rounded-lg p-3 transition-all">
                            {/* <FeatureFlagSwitch
                                featureFlagKey={hypothesisSyncFeatureFlag}
                                onChange={onChangeHypothesisSync}
                            >
                                Back-up notes to my{" "}
                                <a
                                    href="https://web.hypothes.is"
                                    className="underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Hypothes.is
                                </a>{" "}
                                account
                            </FeatureFlagSwitch> */}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

type ImportOption = {
    name: string;
    iconFile: string;
    backgroundColor: string;
};
const importOptions: { [id: string]: ImportOption } = {
    bookmarks: {
        name: "Sync highlights with hypothes.is",
        iconFile: "hypothesis.svg",
        backgroundColor: "bg-rose-400 dark:bg-rose-900",
    },
    // bookmarks: {
    //     name: "Import bookmarks",
    //     iconFile: "chrome.svg",
    //     backgroundColor: "bg-gray-200 dark:bg-gray-700",
    // },
    // pocket: {
    //     name: "Import Pocket",
    //     iconFile: "pocket.png",
    //     backgroundColor: "bg-red-100 dark:bg-red-900",
    // },
    // instapaper: {
    //     name: "Import Instapaper",
    //     iconFile: "instapaper.png",
    //     backgroundColor: "bg-gray-100 dark:bg-gray-800",
    // },
    // raindrop: {
    //     name: "Import Raindrop",
    //     iconFile: "raindrop.svg",
    //     backgroundColor: "bg-blue-100 dark:bg-blue-900",
    // },
    // csv: {
    //     name: "Import CSV",
    //     iconFile: "csv.svg",
    //     backgroundColor: "bg-green-100 dark:bg-green-900",
    // },
};
