import { boot } from "./boot";
import { enhance } from "./enhance";

chrome.contentSettings.javascript.set(
    {
        primaryPattern: "<all_urls>",
        secondaryPattern: "<all_urls>",
        setting: "block",
    },
    () => {
        console.log("JS Blocked");
    }
);

const updateCurrentTab = (): void => {
    const queryOptions = { active: true, lastFocusedWindow: true };
    chrome.tabs.query(queryOptions).then(([tab]) => {
        if (tab == null) {
            return;
        }

        chrome.tabs.update(tab.id, { url: tab.url });
    });
};

// Boot up unclutter then enhance the current page using unclutter
boot()
    .then(() => {
        updateCurrentTab();
        enhance();
    })
    .catch((err: any) => {
        console.log(err.message);
    });
