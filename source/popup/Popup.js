import React, { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import { getHypothesisToken, validateSaveToken } from "../common/storage";
import Switch from "./Switch";

function OptionsPage({}) {
    const [token, setToken] = useState("");
    useEffect(async () => {
        setToken(await getHypothesisToken());
    }, []);
    async function onChangeToken(newToken) {
        setToken(newToken);
        await validateSaveToken(newToken, true);
    }

    const [currentTab, setCurrentTab] = useState(null);
    const [currentDomain, setCurrentDomain] = useState(null);
    useEffect(async () => {
        const tabs = await browser.tabs.query({
            active: true,
            currentWindow: true,
        });
        setCurrentTab(tabs[0]);

        const url = new URL(tabs[0]?.url);
        const hostname = url.hostname.replace("www.", "");
        setCurrentDomain(hostname);
    }, []);

    return (
        <div className="m-3">
            <h1 className="text-lg mb-2">Page view</h1>
            <div>
                <div>
                    Automatically enable on{" "}
                    <span className="font-mono">{currentDomain}</span>
                    <Switch />
                </div>
                <div className="">
                    Automatically on other domains
                    <Switch />
                </div>
            </div>
        </div>
    );
}
export default OptionsPage;
