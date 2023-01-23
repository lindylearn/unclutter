import { supabaseClient } from "@supabase/auth-helpers-nextjs";
import { useUser } from "@supabase/auth-helpers-react";
import {
    setUnclutterLibraryAuth,
    checkHasSubscription,
    useAutoDarkMode,
} from "@unclutter/library-components/dist/common";
import { useContext, useEffect, useState } from "react";
import {
    ReplicacheContext,
    UserInfo,
    useSubscribe,
} from "@unclutter/library-components/dist/store";
import { reportEventPosthog } from "../../common/metrics";
import { useRouter } from "next/router";
import { SmartReadingPreview } from "@unclutter/library-components/dist/components/Settings/SmartReading";
import {
    SettingsButton,
    SettingsGroup,
} from "@unclutter/library-components/dist/components/Settings/SettingsGroup";
import { generateCSV } from "@unclutter/library-components/dist/components/Settings/account";

export default function NewWelcomeTab() {
    const rep = useContext(ReplicacheContext);
    const { user } = useUser();

    const darkModeEnabled = useAutoDarkMode();
    const router = useRouter();

    // @ts-ignore
    const userInfo = useSubscribe<UserInfo>(rep, rep?.subscribe.getUserInfo(), undefined);

    const articles = useSubscribe(rep, rep?.subscribe.listArticles(), null);
    const annotations = useSubscribe(rep, rep?.subscribe.listAnnotations(), null);

    const [isSignup, setIsSignup] = useState(false);
    useEffect(() => {
        (async () => {
            if (!rep || !user || !user.email) {
                return;
            }

            if (userInfo === null) {
                setIsSignup(true);
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

            // await rep.mutate.updateUserInfo({
            //     aiEnabled: false,
            //     accountEnabled: true,
            // });
        })();
    }, [rep, user, userInfo]);

    return (
        <div className="animate-fadein flex flex-col gap-4">
            <SettingsGroup
                title="Welcome!"
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
                        <SettingsButton
                            title="Export data"
                            onClick={() => generateCSV(rep!)}
                            darkModeEnabled={darkModeEnabled}
                            reportEvent={reportEventPosthog}
                        />
                        <SettingsButton
                            title="Sign out"
                            onClick={async () => {
                                await supabaseClient.auth.signOut();
                                router.push("/");
                            }}
                            darkModeEnabled={darkModeEnabled}
                            reportEvent={reportEventPosthog}
                        />
                    </>
                }
            >
                <p>
                    Hey{userInfo?.email && ` ${userInfo?.email}`}, welcome to your Unclutter
                    account!
                </p>

                {!articles?.length ? (
                    <p>Your library is synchronizing...</p>
                ) : (
                    <p>
                        Synchronization done! Your {articles?.length} saved articles and{" "}
                        {annotations?.length} saved highlights are now backed-up and available in
                        every browser where you sign in to this website.
                    </p>
                )}
            </SettingsGroup>

            {/* <SettingsGroup
                title="Import"
                icon={
                    <svg className="h-4 w-4" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M481.2 33.81c-8.938-3.656-19.31-1.656-26.16 5.219l-50.51 50.51C364.3 53.81 312.1 32 256 32C157 32 68.53 98.31 40.91 193.3C37.19 206 44.5 219.3 57.22 223c12.81 3.781 26.06-3.625 29.75-16.31C108.7 132.1 178.2 80 256 80c43.12 0 83.35 16.42 114.7 43.4l-59.63 59.63c-6.875 6.875-8.906 17.19-5.219 26.16c3.719 8.969 12.47 14.81 22.19 14.81h143.9C485.2 223.1 496 213.3 496 200v-144C496 46.28 490.2 37.53 481.2 33.81zM454.7 288.1c-12.78-3.75-26.06 3.594-29.75 16.31C403.3 379.9 333.8 432 255.1 432c-43.12 0-83.38-16.42-114.7-43.41l59.62-59.62c6.875-6.875 8.891-17.03 5.203-26C202.4 294 193.7 288 183.1 288H40.05c-13.25 0-24.11 10.74-24.11 23.99v144c0 9.719 5.844 18.47 14.81 22.19C33.72 479.4 36.84 480 39.94 480c6.25 0 12.38-2.438 16.97-7.031l50.51-50.52C147.6 458.2 199.9 480 255.1 480c99 0 187.4-66.31 215.1-161.3C474.8 305.1 467.4 292.7 454.7 288.1z"
                        />
                    </svg>
                }
            >
                <p></p>
            </SettingsGroup> */}

            <SmartReadingPreview
                userInfo={userInfo}
                darkModeEnabled={darkModeEnabled}
                reportEvent={reportEventPosthog}
            />
        </div>
    );
}
