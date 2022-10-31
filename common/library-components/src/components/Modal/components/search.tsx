import React, { useEffect, useRef } from "react";

export function SearchBox({
    query,
    setQuery,
    placeholder,
}: {
    query: string;
    setQuery: (query: string) => void;
    placeholder: string;
}) {
    const searchRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        searchRef.current?.focus();
    }, [searchRef]);

    return (
        <input
            className="font-text w-full rounded-md bg-stone-50 px-3 py-1.5 font-medium leading-none placeholder-stone-400 outline-none dark:bg-neutral-800 dark:placeholder-neutral-600"
            spellCheck="false"
            autoFocus
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            ref={searchRef}
        />
    );
}
