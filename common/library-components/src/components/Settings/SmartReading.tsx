import React from "react";
import { SettingsButton, SettingsGroup } from "./SettingsGroup";

export function SmartReadingPreview({ userInfo, darkModeEnabled, reportEvent }) {
    const isWeb = ["unclutter.it", "localhost:3001"].includes(window?.location?.host);
    return (
        <SettingsGroup
            title="AI Smart reading"
            icon={
                <svg className="h-4 w-4" viewBox="0 0 512 512">
                    <path
                        fill="currentColor"
                        d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zM256 464c-114.7 0-208-93.31-208-208S141.3 48 256 48s208 93.31 208 208S370.7 464 256 464zM296 336h-16V248C280 234.8 269.3 224 256 224H224C210.8 224 200 234.8 200 248S210.8 272 224 272h8v64h-16C202.8 336 192 346.8 192 360S202.8 384 216 384h80c13.25 0 24-10.75 24-24S309.3 336 296 336zM256 192c17.67 0 32-14.33 32-32c0-17.67-14.33-32-32-32S224 142.3 224 160C224 177.7 238.3 192 256 192z"
                    />
                </svg>
            }
            buttons={
                <>
                    {userInfo?.aiEnabled && (
                        <>
                            <SettingsButton
                                title="Manage subscription"
                                href="https://billing.stripe.com/p/login/5kA8x62Ap9y26v6144"
                                darkModeEnabled={darkModeEnabled}
                                reportEvent={reportEvent}
                            />
                            <SettingsButton
                                title="Import articles"
                                href={(!isWeb ? "https://my.unclutter.it" : "") + "/import"}
                                inNewTab={!isWeb}
                                darkModeEnabled={darkModeEnabled}
                                reportEvent={reportEvent}
                            />
                        </>
                    )}

                    {userInfo?.accountEnabled ? (
                        <>
                            <SettingsButton
                                title="Learn more"
                                href={(!isWeb ? "https://my.unclutter.it" : "") + "/smart-reading"}
                                inNewTab={!isWeb}
                                darkModeEnabled={darkModeEnabled}
                                reportEvent={reportEvent}
                            />
                        </>
                    ) : (
                        <>
                            <SettingsButton
                                title="Create account"
                                href="https://my.unclutter.it/signup"
                                darkModeEnabled={darkModeEnabled}
                                reportEvent={reportEvent}
                            />
                        </>
                    )}
                </>
            }
        >
            {userInfo?.aiEnabled ? (
                <>
                    <p>
                        The AI Smart reading features are enabled. Thank you for supporting
                        Unclutter!
                    </p>
                </>
            ) : (
                <>
                    <p>
                        To help you make sense of what you read, Unclutter can automatically create,
                        index, organize, and surface article highlights for you.
                    </p>
                    <p>
                        See related ideas and facts from your knowledge base whenever you read, and
                        make use of the articles you've already saved with Unclutter, Pocket, or
                        more.
                    </p>
                </>
            )}
        </SettingsGroup>
    );
}
