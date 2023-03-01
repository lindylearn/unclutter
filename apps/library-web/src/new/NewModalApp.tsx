import { LindyIcon, useModalState } from "@unclutter/library-components/dist/components";
import Head from "next/head";
import { useRouter } from "next/router";
import { useUser } from "@supabase/auth-helpers-react";
import { useMediaQuery } from "usehooks-ts";

import { reportEventPosthog } from "../../common/metrics";
import {
    FilterContext,
    ModalStateContext,
} from "@unclutter/library-components/dist/components/Modal/context";
import {
    setUnclutterLibraryAuth,
    useAutoDarkMode,
} from "@unclutter/library-components/dist/common";
import {
    ReplicacheContext,
    UserInfo,
    useSubscribe,
} from "@unclutter/library-components/dist/store";
import { useContext, useEffect } from "react";
import RecentModalTab from "@unclutter/library-components/dist/components/Modal/Recent";
import StatsModalTab from "@unclutter/library-components/dist/components/Modal/Stats";
import QuotesTab from "@unclutter/library-components/dist/components/Modal/Quotes";
import SettingsModalTab from "@unclutter/library-components/dist/components/Modal/Settings";
import Sidebar from "@unclutter/library-components/dist/components/Modal/Sidebar";
import SyncTab from "./Sync";
import AboutModalTab from "@unclutter/library-components/dist/components/Modal/About";
import ReviewDevTab from "../dev/Review";
import ModalDevTab from "../dev/Modal";

export default function NewModalApp() {
    const router = useRouter();
    let initialRoute = router.asPath.split("?")[0].slice(1) || "about";

    // 1.7.1 signup message for registered users
    if (initialRoute === "smart-reading") {
        initialRoute = "about";
    }
    // 1.7.2 modal sidebar link
    if (initialRoute === "import") {
        initialRoute = "sync";
    }

    const rep = useContext(ReplicacheContext);
    const { user } = useUser();
    const userInfo = useSubscribe<UserInfo | null>(rep, rep?.subscribe.getUserInfo());

    const darkModeEnabled = useAutoDarkMode();
    const isMobile = useMediaQuery("(max-width: 767px)");
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
    const currentTabTitle = currentTab[0].toUpperCase() + currentTab.slice(1);

    // only allow access to some tabs before trial enabled
    useEffect(() => {
        if (userInfo && !userInfo?.aiEnabled && !["about", "settings"].includes(currentTab)) {
            setCurrentTab("about");
        }
    }, [userInfo, currentTab]);

    useEffect(() => {
        // update urls on navigation, but keep initial url params
        const currentRoute = router.asPath.split("?")[0].slice(1);
        if (currentRoute !== currentTab) {
            history.replaceState({}, "", `/${currentTab}`);
        }
    }, [currentTab, router]);

    useEffect(() => {
        (async () => {
            if (!rep || !user || !user.email || userInfo === undefined) {
                return;
            }

            if (userInfo === null) {
                console.log("Signing up new user", user);
                await rep.mutate.updateUserInfo({
                    id: user.id,
                    name: user.user_metadata.name,
                    signinProvider: user.app_metadata.provider as any,
                    email: user.email,
                    accountEnabled: true,
                });

                await new Promise((resolve) => setTimeout(resolve, 2000));
                setUnclutterLibraryAuth(user.id);
            } else {
                console.log("Logging in existing user");
                setUnclutterLibraryAuth(user.id);
            }
        })();
    }, [rep, user, userInfo]);

    if (!userInfo) {
        return <></>;
    }

    // dev routes
    if (initialRoute === "modal") {
        return <ModalDevTab />;
    }
    if (initialRoute === "review") {
        return <ReviewDevTab />;
    }

    return (
        <div className="font-text h-screen bg-white text-stone-800 dark:bg-[#212121] dark:text-[rgb(232,230,227)] lg:bg-stone-100 lg:dark:bg-stone-900">
            <Head>
                <title>Unclutter Library | {currentTabTitle}</title>
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
                        showSignup: true,
                        isWeb: true,
                        isMobile,
                        userInfo,
                        reportEvent: reportEventPosthog,
                    }}
                >
                    <div className="font-text flex h-screen flex-row items-stretch overflow-hidden text-base">
                        <aside className="left-side fixed bottom-0 z-[100] w-full border-t-[1px] border-stone-100 lg:static lg:m-4 lg:w-60 lg:border-0">
                            <div className="flex h-full flex-col bg-white p-3 shadow-lg dark:bg-[#212121] md:rounded-lg md:p-4 md:shadow-sm">
                                <div className="mb-4 hidden w-full items-center gap-2 lg:flex">
                                    <LindyIcon className="w-8" />

                                    <h1
                                        className="font-title select-none text-2xl font-bold"
                                        // bg-gradient-to-b from-yellow-300 to-amber-400 bg-clip-text text-transparent
                                        // style={{ WebkitBackgroundClip: "text" }}
                                    >
                                        Unclutter
                                    </h1>
                                </div>

                                <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
                            </div>
                        </aside>
                        <div className="right-side h-screen w-full grow overflow-x-hidden overflow-y-scroll pb-14 pt-4 md:pt-0 lg:h-full lg:p-4 lg:pb-0">
                            <div className="min-h-full max-w-5xl bg-white pt-0 dark:bg-[#212121] md:p-4 lg:rounded-lg lg:py-6 lg:px-8 lg:shadow-sm">
                                {currentTab === "articles" && <RecentModalTab />}
                                {currentTab === "stats" && <StatsModalTab />}
                                {currentTab === "quotes" && <QuotesTab />}
                                {currentTab === "settings" && <SettingsModalTab />}
                                {currentTab === "about" && <AboutModalTab />}
                                {currentTab === "sync" && <SyncTab />}
                            </div>
                        </div>
                    </div>
                </ModalStateContext.Provider>
            </FilterContext.Provider>
        </div>
    );
}
