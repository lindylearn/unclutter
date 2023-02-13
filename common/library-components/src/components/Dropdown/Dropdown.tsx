import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";

export function Dropdown({
    open,
    setOpen,
    small,
    children,
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
    small?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div
            className="absolute top-0 right-0.5"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
        >
            <DropdownMenu.Root open={open} onOpenChange={setOpen} modal={false}>
                <DropdownMenu.Trigger
                    className={clsx(
                        "dropdown-icon cursor-pointer outline-none transition-all",
                        small ? "p-1" : "p-1.5"
                    )}
                >
                    <svg className={clsx(small ? "h-3 w-3" : "h-4 w-4")} viewBox="0 0 384 512">
                        <path
                            fill="currentColor"
                            d="M360.5 217.5l-152 143.1C203.9 365.8 197.9 368 192 368s-11.88-2.188-16.5-6.562L23.5 217.5C13.87 208.3 13.47 193.1 22.56 183.5C31.69 173.8 46.94 173.5 56.5 182.6L192 310.9l135.5-128.4c9.562-9.094 24.75-8.75 33.94 .9375C370.5 193.1 370.1 208.3 360.5 217.5z"
                        />
                    </svg>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                    <DropdownMenu.Content
                        className="dropdown-content z-100 font-text z-50 cursor-pointer rounded bg-white text-sm font-medium text-stone-800 drop-shadow dark:bg-stone-700 dark:text-stone-300"
                        side="right"
                        align="start"
                        sideOffset={6}
                    >
                        <DropdownMenu.Arrow className="dropdown-elem fill-white dark:fill-stone-700" />
                        {children}
                    </DropdownMenu.Content>
                </DropdownMenu.Portal>
            </DropdownMenu.Root>
        </div>
    );
}

export function DropdownItem({ title, svg, onSelect, top = false, bottom = false }) {
    return (
        <DropdownMenu.Item
            className={clsx(
                "dropdown-elem flex items-center gap-2 px-2 py-0.5 outline-none transition-all hover:bg-stone-100 dark:hover:bg-stone-600",
                top && "rounded-t pt-1",
                bottom && "rounded-b pb-1"
            )}
            onSelect={onSelect}
        >
            {svg}
            {title}
        </DropdownMenu.Item>
    );
}
