import { LibraryModalPage } from "@unclutter/library-components/dist/components/Modal";
import { ModalVisibilityContext } from "@unclutter/library-components/dist/components/Modal/context";
import { UserInfo } from "@unclutter/library-components/dist/store";
import React, { useContext } from "react";

export default function NewTabModal({
    userInfo,
    darkModeEnabled,
    reportEvent = () => {},
}: {
    userInfo: UserInfo;
    darkModeEnabled: boolean;
    reportEvent?: (event: string, properties?: any) => void;
}) {
    // prevent initial fade-out animation
    // @ts-ignore
    const { isVisible } = useContext(ModalVisibilityContext);
    if (isVisible === null) {
        return <></>;
    }

    return (
        <LibraryModalPage
            userInfo={userInfo}
            darkModeEnabled={darkModeEnabled}
            showSignup={false}
            initialTab="articles"
            reportEvent={reportEvent}
        />
    );
}
