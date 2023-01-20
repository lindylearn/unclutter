import clsx from "clsx";
import React, { ReactNode } from "react";
import { getActivityColor } from "../Charts";

export function SettingsGroup({
    title,
    icon,
    children,
    className,
}: {
    title: string;
    icon: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={clsx(
                "relative z-20 overflow-hidden rounded-md bg-stone-50 p-3 px-4 dark:bg-neutral-800",
                className
            )}
        >
            <h2 className="mb-2 flex items-center gap-2 font-medium">
                {icon}
                {title}
            </h2>
            <div className="flex max-w-2xl flex-col gap-3">{children}</div>
        </div>
    );
}

export function SettingsButton({
    title,
    href,
    onClick,
    primary,
    darkModeEnabled,
    isNew,
    inNewTab = true,
    reportEvent,
}: {
    title: string;
    href?: string;
    onClick?: () => void;
    primary?: boolean;
    darkModeEnabled: boolean;
    isNew?: boolean;
    inNewTab?: boolean;
    reportEvent: (event: string, data?: any) => void;
}) {
    return (
        <a
            className={clsx(
                "relative cursor-pointer select-none rounded-md py-1 px-2 font-medium transition-transform hover:scale-[97%]",
                true && "dark:text-stone-800"
            )}
            style={{ background: getActivityColor(primary ? 3 : 3, false) }}
            onClick={() => {
                onClick?.();
                reportEvent("clickSettingsButton", { title });
            }}
            href={href}
            target={inNewTab ? "_blank" : undefined}
            rel="noopener noreferrer"
        >
            {title}

            {isNew && (
                <div className="bg-lindy dark:bg-lindyDark absolute -top-2 -right-5 z-20 rounded-md px-1 text-sm leading-tight dark:text-[rgb(232,230,227)]">
                    New
                </div>
            )}
        </a>
    );
}
