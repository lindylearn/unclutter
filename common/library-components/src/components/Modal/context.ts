import { createContext } from "react";
import { FeedSubscription, Topic, UserInfo } from "../../store";

export const ModalVisibilityContext = createContext<{
    isVisible: boolean;
    closeModal?: () => void;
}>({
    isVisible: false,
    closeModal: () => {},
});

export const ModalStateContext = createContext<{
    darkModeEnabled: boolean;
    isWeb?: boolean;
    isMobile?: boolean;
    showSignup: boolean;
    userInfo?: UserInfo;
    reportEvent: (event: string, data?: any) => void;
}>({
    darkModeEnabled: false,
    isWeb: false,
    isMobile: false,
    showSignup: false,
    reportEvent: () => {},
});

export const FilterContext = createContext<{
    currentArticle?: string;
    tagFilter?: string;
    domainFilter?: string;
    currentSubscription?: FeedSubscription;
    setTagFilter: (tag?: string) => void;
    showDomain: (domain: string) => void;
    setDomainFilter: (domain?: string) => void;
    setCurrentSubscription: (subscription?: FeedSubscription) => void;
    relatedLinkCount?: number;
}>({
    setTagFilter: () => {},
    showDomain: () => {},
    setDomainFilter: () => {},
    setCurrentSubscription: () => {},
});
