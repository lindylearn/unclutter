import { LindyIcon, useModalState } from "@unclutter/library-components/dist/components";
import Head from "next/head";
import { useRouter } from "next/router";
import { useUser } from "@supabase/auth-helpers-react";

import { reportEventPosthog } from "../../common/metrics";
import {
    FilterContext,
    ModalStateContext,
} from "@unclutter/library-components/dist/components/Modal/context";
import {
    setUnclutterLibraryAuth,
    useAutoDarkMode,
} from "@unclutter/library-components/dist/common";
import { ReplicacheContext, useSubscribe } from "@unclutter/library-components/dist/store";
import { useContext, useEffect } from "react";
import RecentModalTab from "@unclutter/library-components/dist/components/Modal/Recent";
import StatsModalTab from "@unclutter/library-components/dist/components/Modal/Stats";
import QuotesTab from "@unclutter/library-components/dist/components/Modal/Quotes";
import SettingsModalTab from "@unclutter/library-components/dist/components/Modal/Settings";
import Sidebar from "@unclutter/library-components/dist/components/Modal/Sidebar";
import NewImportTab from "./Import";
import AboutModalTab from "@unclutter/library-components/dist/components/Modal/About";

export default function NewModalApp() {
    const router = useRouter();
    const initialRoute = router.asPath.split("?")[0].slice(1) || "about";

    const rep = useContext(ReplicacheContext);
    const { user } = useUser();
    const userInfo = useSubscribe(rep, rep?.subscribe.getUserInfo(), null);

    const darkModeEnabled = useAutoDarkMode();
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
    } = useModalState(initialRoute, undefined, undefined, reportEventPosthog);

    useEffect(() => {
        // update urls on navigation, but keep initial url params
        const currentRoute = router.asPath.split("?")[0].slice(1);
        if (currentRoute !== currentTab) {
            history.replaceState({}, "", `/${currentTab}`);
        }
    }, [currentTab, router]);

    if (!userInfo) {
        return <></>;
    }

    return (
        <div className="font-text min-h-screen bg-white text-stone-800 dark:bg-[rgb(19,21,22)] dark:text-[rgb(232,230,227)] lg:bg-stone-100 lg:dark:bg-[#212121]">
            <Head>
                <title>Unclutter Library</title>
            </Head>

            <FilterContext.Provider
                value={{
                    currentArticle: undefined,
                    currentSubscription,
                    domainFilter,
                    tagFilter,
                    setDomainFilter,
                    showDomain,
                    setTagFilter,
                    setCurrentSubscription,
                    relatedLinkCount: undefined,
                }}
            >
                <ModalStateContext.Provider
                    value={{
                        darkModeEnabled,
                        showSignup: false,
                        isWeb: true,
                        userInfo,
                        reportEvent: reportEventPosthog,
                    }}
                >
                    <div className="font-text flex h-screen flex-col items-stretch overflow-hidden text-base lg:flex-row">
                        <aside className="left-side w-full md:m-4 lg:w-60">
                            <div className="flex h-full flex-col bg-white p-4 shadow-sm dark:bg-[#212121] md:rounded-lg">
                                <div className="mb-4 hidden w-full items-center gap-2 lg:flex">
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
                        <div className="right-side h-screen w-full overflow-y-auto">
                            <div className="max-w-5xl bg-white p-4 pt-0 dark:bg-[#212121] md:m-4 md:rounded-lg md:py-6 md:px-8 lg:shadow-sm">
                                {currentTab === "list" && <RecentModalTab />}
                                {currentTab === "stats" && <StatsModalTab />}
                                {currentTab === "highlights" && <QuotesTab />}
                                {currentTab === "settings" && <SettingsModalTab />}
                                {currentTab === "about" && <AboutModalTab />}
                                {currentTab === "import" && <NewImportTab />}
                            </div>
                        </div>
                    </div>
                </ModalStateContext.Provider>
            </FilterContext.Provider>
        </div>
    );
}
