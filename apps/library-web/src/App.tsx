import Head from "next/head";
import { cloneElement, useContext, useEffect, useState } from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { Redirect, Route, Switch, useLocation } from "wouter";

import HeaderBar from "./components/HeaderBar";
import {
    ReplicacheContext,
    Settings,
    UserInfo,
    useSubscribe,
} from "@unclutter/library-components/dist/store";
import DashboardTab from "./tabs/Dashboard";
import ExportTab from "./tabs/Export";
import FavoritesTab from "./tabs/Favorites";
import ImportTab from "./tabs/Import/_Import";
import SearchTab from "./tabs/Search";
import SettingsTab from "./tabs/Settings";
import TopicsListTab from "./tabs/TopicsList";
import WelcomeTab from "./tabs/Welcome";
import ModalTestTab from "./tabs/ModalTest";
import Welcome2Tab from "./tabs/Welcome2";
import { reportEventPosthog } from "../common/metrics";

export interface LibraryTab {
    id: string;
    title: string;
    showInHeader?: boolean;
}
export const defaultTabs: LibraryTab[] = [
    {
        id: "welcome",
        title: "Welcome to Unclutter Library!",
    },
    {
        id: "",
        title: "Your Unclutter Library",
    },
    {
        id: "search",
        title: "Search",
        showInHeader: true,
    },
    {
        id: "topics",
        title: "Your article topics",
        showInHeader: true,
    },
    // {
    //     id: "favorites",
    //     title: "Your favorite articles",
    //     showInHeader: true,
    // },
    {
        id: "settings",
        title: "Your library settings",
    },
    {
        id: "import",
        title: "Import articles",
    },
    {
        id: "export",
        title: "Export data",
    },
];

export default function App() {
    const rep = useContext(ReplicacheContext);
    const articleCount = useSubscribe(rep, rep?.subscribe.getArticlesCount(), null);

    // location state
    const [lastLocation, setLastLocation] = useState<string>();
    const [location, setLocation] = useLocation();
    const activeTab = defaultTabs.find((tab) => tab.id === location?.slice(1).split("/")[0]);
    useEffect(() => {
        reportEventPosthog("$pageview");
    }, [location]);

    // search redirect
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedTopicId, setSelectedTopicId] = useState<string | null>();
    useEffect(() => {
        if (location !== "/search" && searchQuery !== "") {
            window.history.replaceState(null, "", "/search");
        }
    }, [searchQuery]);
    useEffect(() => {
        if (location !== "/search") {
            setSearchQuery("");
        }
        if (location !== "/") {
            setSelectedTopicId(null);
        }
        if (location.startsWith("/topics/")) {
            const topicId = location.split("/topics/")[1];
            if (topicId) {
                setSelectedTopicId(topicId);
                setLocation("/");
            }
        }
    }, [location]);

    // @ts-ignore
    const userInfo: UserInfo | undefined | null = useSubscribe(
        rep,
        rep?.subscribe.getUserInfo(),
        // @ts-ignore
        undefined
    );
    // @ts-ignore
    const settings: Settings | undefined = useSubscribe(
        rep,
        rep?.subscribe.getSettings(),
        // @ts-ignore
        undefined
    );

    if (!userInfo === undefined) {
        // still fetching
        return <></>;
    }
    if (!userInfo || (!userInfo.onPaidPlan && !userInfo.trialEnabled)) {
        return <Welcome2Tab />;
    }

    if (location === "/link") {
        return <Welcome2Tab />;
    }
    if (location === "/modal") {
        return <ModalTestTab />;
    }

    return (
        <div className="bg-background dark:bg-backgroundDark font-text h-screen w-screen overflow-hidden pt-12 text-stone-900 dark:text-stone-300">
            <Head>
                <title>{activeTab?.title}</title>
            </Head>

            <HeaderBar
                tabs={defaultTabs}
                articleCount={articleCount}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedTopicId={selectedTopicId}
                setSelectedTopicId={setSelectedTopicId}
            />

            <TransitionGroup
                className="tab-page-container h-full overflow-scroll"
                id="scollable-page"
                // @ts-ignore
                childFactory={(child) => {
                    if (lastLocation !== location) {
                        setLastLocation(location);

                        // determine animation direction
                        const lastTabIndex = defaultTabs.findIndex(
                            (tab) => tab.id === lastLocation?.slice(1).split("/")[0]
                        );
                        const newTabIndex = defaultTabs.findIndex(
                            (tab) => tab.id === location?.slice(1).split("/")[0]
                        );
                        let moveToLeft = lastTabIndex > newTabIndex;
                        if (lastTabIndex === newTabIndex) {
                            moveToLeft = !location.startsWith(lastLocation!);
                        }

                        return cloneElement(child, {
                            classNames: moveToLeft ? "move-tab-left" : "move-tab-right",
                        });
                    }

                    return child;
                }}
            >
                <CSSTransition timeout={500} classNames="tab-page" key={location}>
                    <Switch location={location}>
                        <Route path="/">
                            {((settings && settings?.tutorial_stage === undefined) ||
                                (settings?.tutorial_stage && settings?.tutorial_stage < 3)) && (
                                <Redirect to="/welcome" />
                            )}
                            {settings?.tutorial_stage && settings?.tutorial_stage >= 3 && (
                                <DashboardTab
                                    selectedTopicId={selectedTopicId}
                                    setSelectedTopicId={setSelectedTopicId}
                                />
                            )}
                        </Route>

                        <Route path="/filter">
                            <DashboardTab
                                selectedTopicId={selectedTopicId}
                                setSelectedTopicId={setSelectedTopicId}
                            />
                        </Route>

                        {/* rendering components via the tab config seems to break hot reloading */}
                        <Route path="/welcome">
                            <WelcomeTab />
                        </Route>
                        <Route path="/search">
                            <SearchTab searchQuery={searchQuery} />
                        </Route>
                        <Route path="/topics">
                            <TopicsListTab setSelectedTopicId={setSelectedTopicId} />
                        </Route>
                        {/* <Route path="/topics/:group_id">
                            {(params) => (
                                <TopicGroupTab
                                    group_id={(params as any).group_id}
                                />
                            )}
                        </Route> */}
                        <Route path="/favorites">
                            <FavoritesTab />
                        </Route>
                        <Route path="/settings">
                            <SettingsTab />
                        </Route>
                        <Route path="/import">
                            <ImportTab />
                        </Route>
                        <Route path="/export">
                            <ExportTab />
                        </Route>
                    </Switch>
                </CSSTransition>
            </TransitionGroup>
        </div>
    );
}
