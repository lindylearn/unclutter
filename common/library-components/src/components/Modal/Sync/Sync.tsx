import clsx from "clsx";
import React, { useContext, useState } from "react";
import { ModalStateContext } from "../context";
import { ImportProgress, indexLibraryArticles } from "../../../common/import";
import { ReplicacheContext } from "../../../store";

export default function SyncModalTab({}: {}) {
    const { userInfo, reportEvent } = useContext(ModalStateContext);
    const rep = useContext(ReplicacheContext);

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

    const [progress, setProgress] = useState<ImportProgress>();
    const progressPercentage =
        progress?.currentArticles !== undefined &&
        progress?.targetArticles &&
        progress.currentArticles / progress.targetArticles;

    function generateHighlights() {
        if (!rep || !userInfo?.aiEnabled) {
            return;
        }

        indexLibraryArticles(rep, userInfo, setProgress);
    }

    return (
        <div className="flex min-h-full flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
                {Object.entries(importOptions).map(([id, option]) => (
                    <div
                        key={id}
                        className={clsx(
                            "relative flex select-none flex-col gap-4 overflow-hidden rounded-md bg-stone-50 p-4 transition-transform hover:scale-[99%] dark:bg-neutral-800",
                            option.backgroundColor
                        )}
                        onClick={generateHighlights}
                    >
                        <h2 className="flex items-center gap-2 font-medium">
                            <img
                                className="inline-block h-4 w-4"
                                src={`https://library.lindylearn.io/logos/${option.iconFile}`}
                            />
                            {option.name}
                        </h2>

                        <div className="flex h-24 flex-col gap-2 transition-all">
                            <p>Create AI annotations for your saved articles.</p>

                            {progress && progressPercentage && progressPercentage < 1 && (
                                <p>
                                    {progress.targetArticles - (progress?.currentArticles || 0)}{" "}
                                    articles left...
                                </p>
                            )}
                            {progressPercentage === 1 && <p>Finished!</p>}
                        </div>

                        <div
                            className="bg-lindy dark:bg-lindyDark absolute bottom-0 left-0 h-4 transition-all"
                            style={{
                                width: `${(progressPercentage || 0) * 100}%`,
                            }}
                        />
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
    library: {
        name: "Generate highlights",
        iconFile: "",
        backgroundColor: "bg-amber-400 dark:bg-yellow-800",
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
    // hypothesis: {
    //     name: "Sync with hypothes.is",
    //     iconFile: "hypothesis.svg",
    //     backgroundColor: "bg-rose-400 dark:bg-rose-900",
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
