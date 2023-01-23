import clsx from "clsx";
import React, { ReactNode } from "react";
import { getActivityColor } from "../Charts";

export function SettingsGroup({
    title,
    icon,
    children,
    buttons,
    className,
    imageSrc,
}: {
    title: string;
    icon: ReactNode;
    children: ReactNode;
    buttons?: ReactNode;
    className?: string;
    imageSrc?: string;
}) {
    return (
        <div
            className={clsx(
                "animate-fadein relative z-20 overflow-hidden rounded-md bg-stone-50 dark:bg-neutral-800",
                className
            )}
        >
            <h2 className="flex items-center gap-2 py-3 px-4 font-medium">
                {icon}
                {title}
            </h2>
            <div className="flex max-w-2xl flex-col gap-2 px-4 pb-3">
                {children}
                {buttons && <div className="mt-1 flex flex-wrap gap-3">{buttons}</div>}
            </div>

            {imageSrc && (
                <img
                    src={imageSrc}
                    className="mt-1 h-60 w-full bg-stone-100 object-cover object-right-top"
                />
            )}
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
    className,
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
    className?: string;
    reportEvent: (event: string, data?: any) => void;
}) {
    return (
        <a
            className={clsx(
                "relative cursor-pointer select-none rounded-md py-1 px-2 font-medium transition-transform hover:scale-[97%]",
                true && "dark:text-stone-800",
                className
            )}
            style={{ background: !className ? getActivityColor(primary ? 3 : 3, false) : "" }}
            onClick={() => {
                onClick?.();
                reportEvent("clickSettingsButton", { title });
            }}
            href={href}
            target={inNewTab ? "_blank" : undefined}
            rel="noopener noreferrer"
        >
            {title}

            {/* {isNew && (
                <div className="bg-lindy dark:bg-lindyDark absolute -top-2 -right-5 z-20 rounded-md px-1 text-sm leading-tight dark:text-[rgb(232,230,227)]">
                    New
                </div>
            )} */}
        </a>
    );
}
