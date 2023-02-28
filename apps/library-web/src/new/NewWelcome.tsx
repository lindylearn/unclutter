import { supabaseClient } from "@supabase/auth-helpers-nextjs";
import { useUser } from "@supabase/auth-helpers-react";
import {
    setUnclutterLibraryAuth,
    checkHasSubscription,
    useAutoDarkMode,
} from "@unclutter/library-components/dist/common";
import { useContext, useEffect, useState } from "react";
import {
    Annotation,
    Article,
    ReplicacheContext,
    UserInfo,
    useSubscribe,
} from "@unclutter/library-components/dist/store";
import { reportEventPosthog } from "../../common/metrics";
import { useRouter } from "next/router";
import {
    SmartReadingPreview,
    usePaymentsLink,
} from "@unclutter/library-components/dist/components/Settings/SmartReading";
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

    const userInfo = useSubscribe<UserInfo>(rep, rep?.subscribe.getUserInfo());
    const articles = useSubscribe<Article[]>(rep, rep?.subscribe.listArticles());
    const annotations = useSubscribe<Annotation[]>(rep, rep?.subscribe.listAnnotations());

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
            //     stripeId: undefined,
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
                animationIndex={0}
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

            {userInfo && (
                <SmartReadingPreview
                    userInfo={userInfo}
                    darkModeEnabled={darkModeEnabled}
                    reportEvent={reportEventPosthog}
                    animationIndex={1}
                />
            )}
        </div>
    );
}
