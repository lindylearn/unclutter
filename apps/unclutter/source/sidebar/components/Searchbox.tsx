import React, { useEffect, useState } from "react";

export default function SearchBox({}: {}) {
    return (
        <div className="annotation relative mt-2 flex flex-col gap-2 overflow-hidden rounded-md px-3 py-2 text-sm shadow">
            <input
                className="w-full select-none resize-none overflow-hidden bg-transparent align-top outline-none placeholder:select-none placeholder:text-stone-400 placeholder:opacity-50 dark:placeholder:text-stone-600"
                placeholder="What do you want to learn?"
                spellCheck={false}
            />
        </div>
    );
}
