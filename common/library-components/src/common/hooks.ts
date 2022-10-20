import React, { useEffect, useState } from "react";

export function useAutoDarkMode(): boolean {
    const [darkModeEnabled, setDarkModeEnabled] = useState(
        window.matchMedia("(prefers-color-scheme: dark)").matches
    );
    useEffect(() => {
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
            setDarkModeEnabled(event.matches);
        });
    }, []);

    return darkModeEnabled;
}
