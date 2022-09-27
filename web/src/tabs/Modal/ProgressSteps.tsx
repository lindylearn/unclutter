import clsx from "clsx";
import React from "react";

export default function ProgressSteps({
    darkModeEnabled,
    isSelected = false,
    onClick,
    current,
    target = 8,
}: {
    darkModeEnabled: boolean;
    isSelected?: boolean;
    onClick: () => void;
    current: number;
    target?: number;
}) {
    return (
        <div
            className={clsx(
                "flex items-center justify-end gap-2 rounded-md px-2 transition-all hover:scale-x-[99%] hover:scale-y-[97%] hover:cursor-pointer",
                isSelected
                    ? "bg-stone-100 dark:bg-neutral-800"
                    : "hover:bg-stone-100 dark:hover:bg-neutral-800"
            )}
            onClick={onClick}
        >
            {Array.from({ length: target }, (_, i) => (
                <React.Fragment key={i}>
                    <Step key={i} completed={i <= current} />
                    {i < target - 1 && <Connection completed={i < current} />}
                </React.Fragment>
            ))}
        </div>
    );
}

function Step({ completed }: { completed: boolean }) {
    return (
        <div
            className={clsx(
                "h-4 w-4 rounded-md",
                completed
                    ? "bg-lindy dark:bg-lindyDark"
                    : "bg-neutral-200 dark:bg-neutral-700"
            )}
        ></div>
    );
}

function Connection({ completed }: { completed: boolean }) {
    return (
        <div
            className={clsx(
                "h-1 w-8 rounded-md",
                completed
                    ? "bg-lindy dark:bg-lindyDark opacity-80"
                    : "bg-neutral-200 dark:bg-neutral-700"
            )}
        ></div>
    );
}
