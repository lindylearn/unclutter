import clsx from "clsx";
import React from "react";

export function InlineProgressCircle({
    current,
    target = 6,
    className,
}: {
    current?: number;
    target?: number;
    className?: string;
}) {
    let strokeDashoffset =
        288.5 - 288.5 * Math.min(1.0, (current || 0) / target);

    return (
        <svg
            viewBox="-10 -10 120 120"
            className={clsx("inline-block w-4", className)}
        >
            {/* <path
                className="placeholder"
                d="M 50 96 a 46 46 0 0 1 0 -92 46 46 0 0 1 0 92"
            /> */}
            <path
                className="logoPath"
                stroke="currentColor"
                strokeWidth={15}
                style={{
                    strokeDashoffset: strokeDashoffset,
                }}
                d="M 50 96 a 46 46 0 0 1 0 -92 46 46 0 0 1 0 92"
                shape-rendering="geometricPrecision"
            />
        </svg>
    );
}
