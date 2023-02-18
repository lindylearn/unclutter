import React, { useRef } from "react";
import clsx from "clsx";
import { useContext, useEffect, useState } from "react";

import StatsModalTab from "./Stats";
import Sidebar from "./Sidebar";
import type { FeedSubscription, UserInfo } from "../../store";
import RecentModalTab from "./Recent";
import { LindyIcon } from "../Icons";
import SettingsModalTab from "./Settings";
import { ModalVisibilityContext, FilterContext, ModalStateContext } from "./context";
import QuotesTab from "./Quotes";
import AboutModalTab from "./About";

export function LibraryModalPage({
    userInfo,
    darkModeEnabled = false,
    showSignup = false,
    currentArticle,
    initialSubscription,
    initialTagFilter,
    initialTab,
    relatedLinkCount,
    reportEvent = () => {},
}: {
    userInfo: UserInfo;
    darkModeEnabled?: boolean;
    showSignup?: boolean;
    currentArticle?: string;
    initialSubscription?: FeedSubscription;
    initialTagFilter?: string;
    initialTab?: string;
    relatedLinkCount?: number;
    closeModal?: () => void;
    reportEvent?: (event: string, data?: any) => void;
}) {
    const { isVisible, closeModal } = useContext(ModalVisibilityContext);
    const {
        currentTab,
        setCurrentTab,
        currentSubscription,
        setCurrentSubscription,
        domainFilter,
        setDomainFilter,
        tagFilter,
        setTagFilter,
        showDomain,
    } = useModalState(
        initialTab || "highlights",
        initialSubscription,
        initialTagFilter,
        reportEvent
    );

    return (
        <div
            className={clsx(
                "modal fixed top-0 left-0 h-screen w-screen text-base",
                isVisible && "modal-visible",
                isVisible === false && "modal-hidden",
                darkModeEnabled && "dark"
            )}
            style={
                darkModeEnabled
                    ? {
                          colorScheme: "dark",
                      }
                    : {}
            }
        >
            <div
                className="modal-background absolute top-0 left-0 h-full w-full cursor-zoom-out bg-stone-800 opacity-50 dark:bg-[rgb(19,21,22)]"
                onClick={closeModal}
            />
            <div className="modal-content relative z-10 mx-auto mt-10 flex h-5/6 max-h-[700px] max-w-5xl flex-col overflow-hidden rounded-lg bg-white text-stone-800 shadow dark:bg-[#212121] dark:text-[rgb(232,230,227)]">
                <FilterContext.Provider
                    value={{
                        currentArticle,
                        currentSubscription,
                        domainFilter,
                        tagFilter,
                        setDomainFilter,
                        showDomain,
                        setTagFilter,
                        setCurrentSubscription,
                        relatedLinkCount,
                    }}
                >
                    <ModalStateContext.Provider
                        value={{ darkModeEnabled, showSignup, userInfo, reportEvent }}
                    >
                        <ModalContent currentTab={currentTab} setCurrentTab={setCurrentTab} />
                    </ModalStateContext.Provider>
                </FilterContext.Provider>
            </div>
        </div>
    );
}

export function useModalState(
    initialTab: string,
    initialSubscription?: FeedSubscription,
    initialTagFilter?: string,
    reportEvent: (event: string, data?: any) => void = () => {}
) {
    const initialRender = useRef<boolean>(true);
    const [currentTab, setCurrentTab] = useState(initialTab);
    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;
        } else {
            reportEvent("changeModalTab", { tab: currentTab });
        }

        if (currentTab !== "highlights") {
            setDomainFilter(undefined);
            setTagFilter(undefined);
        }
    }, [currentTab]);

    const [currentSubscription, setCurrentSubscription] = useState<FeedSubscription | undefined>(
        initialSubscription
    );
    const [domainFilter, setDomainFilter] = useState<string>();
    const [tagFilter, setTagFilter] = useState<string | undefined>(initialTagFilter);
    async function showDomain(domain: string) {
        setDomainFilter(domain);
        setCurrentTab("highlights");

        reportEvent("showDomainDetails");
    }

    return {
        currentTab,
        setCurrentTab,
        currentSubscription,
        setCurrentSubscription,
        domainFilter,
        setDomainFilter,
        tagFilter,
        setTagFilter,
        showDomain,
    };
}

function ModalContent({
    currentTab,
    setCurrentTab,
}: {
    currentTab: string;
    setCurrentTab: (tab: string) => void;
}) {
    return (
        <div className="font-text flex h-full items-stretch overflow-hidden text-base">
            <aside className="left-side p-4">
                <div className="flex h-full w-32 flex-col">
                    <div className="mb-4 flex w-full items-center gap-2">
                        <LindyIcon className="w-8" />

                        <h1
                            className="font-title select-none text-2xl font-bold"
                            // bg-gradient-to-b from-yellow-300 to-amber-400 bg-clip-text text-transparent
                            // style={{ WebkitBackgroundClip: "text" }}
                        >
                            Library
                        </h1>
                    </div>

                    <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
                </div>
            </aside>
            <div
                className={clsx(
                    "right-side flex h-full max-h-full w-full flex-col",
                    currentTab === "stats" ? "overflow-y-scroll" : "overflow-y-auto",
                    currentTab === "graph" ? "" : "p-4"
                )}
            >
                {currentTab === "articles" && <RecentModalTab />}
                {currentTab === "stats" && <StatsModalTab />}
                {currentTab === "highlights" && <QuotesTab />}
                {currentTab === "settings" && <SettingsModalTab />}
                {currentTab === "about" && <AboutModalTab />}
            </div>
        </div>
    );
}
