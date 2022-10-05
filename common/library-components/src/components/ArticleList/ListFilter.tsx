import React from "react";
import * as Select from "@radix-ui/react-select";
import clsx from "clsx";
import { ReactNode } from "react";

export interface FilterOption {
    label: string;
    value: string;
}

const timeFilters: FilterOption[] = [
    { label: "This week", value: "7d" },
    { label: "This month", value: "1m" },
];

const stateFilters: FilterOption[] = [
    { label: "All articles", value: "all" },
    { label: "Unread articles", value: "unread" },
];

export function TimeFilter({}: {}) {
    return (
        <ListFilter
            options={timeFilters}
            svg={
                <svg viewBox="0 0 448 512" className="h-4">
                    <path
                        fill="currentColor"
                        d="M152 64H296V24C296 10.75 306.7 0 320 0C333.3 0 344 10.75 344 24V64H384C419.3 64 448 92.65 448 128V448C448 483.3 419.3 512 384 512H64C28.65 512 0 483.3 0 448V128C0 92.65 28.65 64 64 64H104V24C104 10.75 114.7 0 128 0C141.3 0 152 10.75 152 24V64zM48 448C48 456.8 55.16 464 64 464H384C392.8 464 400 456.8 400 448V192H48V448z"
                    />
                </svg>
            }
        />
    );
}

export function StateFilter({}: {}) {
    return (
        <ListFilter
            options={stateFilters}
            svg={
                <svg viewBox="0 0 512 512" className="h-4">
                    <path
                        fill="currentColor"
                        d="M0 73.7C0 50.67 18.67 32 41.7 32H470.3C493.3 32 512 50.67 512 73.7C512 83.3 508.7 92.6 502.6 100L336 304.5V447.7C336 465.5 321.5 480 303.7 480C296.4 480 289.3 477.5 283.6 472.1L191.1 399.6C181.6 392 176 380.5 176 368.3V304.5L9.373 100C3.311 92.6 0 83.3 0 73.7V73.7zM54.96 80L218.6 280.8C222.1 285.1 224 290.5 224 296V364.4L288 415.2V296C288 290.5 289.9 285.1 293.4 280.8L457 80H54.96z"
                    />
                </svg>
            }
        />
    );
}

export function ListFilter({
    options,
    svg,
}: {
    options: FilterOption[];
    svg: ReactNode;
}) {
    return (
        <Select.Root defaultValue={options[0].value} dir="ltr">
            <Select.Trigger className="rounded-md bg-stone-50 px-2 py-1 outline-none dark:bg-neutral-800">
                <Select.Value />
            </Select.Trigger>

            <Select.Portal>
                <Select.Content className="z-100 z-50 rounded-md bg-stone-50 shadow dark:bg-neutral-800">
                    <Select.ScrollUpButton />
                    <Select.Viewport>
                        {options.map((option, index) => (
                            <SelectOption
                                key={option.value}
                                svg={svg}
                                option={option}
                                top={index === 0}
                                bottom={index === options.length - 1}
                            />
                        ))}
                    </Select.Viewport>
                    <Select.ScrollDownButton />
                </Select.Content>
            </Select.Portal>
        </Select.Root>
    );
}

function SelectOption({ svg, option, top = false, bottom = false }) {
    return (
        <Select.Item
            value={option.value}
            className={clsx(
                "font-text cursor-pointer px-2 py-1 text-left text-base outline-none transition-all hover:bg-stone-100 dark:hover:bg-stone-600",
                top && "rounded-t-md pt-1",
                bottom && "rounded-b-md pb-1"
            )}
        >
            <Select.ItemText>
                <div className="flex items-center gap-2">
                    {svg}
                    {option.label}
                </div>
            </Select.ItemText>
            {/* <Select.ItemIndicator /> */}
        </Select.Item>
    );
}
