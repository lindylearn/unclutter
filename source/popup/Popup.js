import React, { useEffect, useState } from "react";
import browser from "../common/polyfill";
import Switch from "./Switch";

function OptionsPage({}) {
    // const [token, setToken] = useState("");
    // useEffect(async () => {
    //     setToken(await getHypothesisToken());
    // }, []);
    // async function onChangeToken(newToken) {
    //     setToken(newToken);
    //     await validateSaveToken(newToken, true);
    // }

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
        <div className="flex flex-col gap-3">
            <div>
                {/* <div className="text-base flex justify-between align-middle">
                    <div>
                        Automatically unclutter{" "}
                        <span className="font-mono">{currentDomain}</span>
                    </div>

                    <Switch />
                </div> */}
                <div className="text-base flex justify-between align-middle">
                    <div>Automatically unclutter all pages</div> <Switch />
                </div>
                <div className="text-base">
                    Except 7 domains including google.com
                </div>
            </div>
        </div>
    );
}
export default OptionsPage;
