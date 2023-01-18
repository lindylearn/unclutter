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
import {
    SettingsGroup,
    Button,
    generateCSV,
} from "@unclutter/library-components/dist/components/Modal/Settings";
import { getActivityColor } from "@unclutter/library-components/dist/components";
import { reportEventPosthog } from "../../common/metrics";
import { useRouter } from "next/router";

export default function NewWelcomeTab() {
    const rep = useContext(ReplicacheContext);
    const { user } = useUser();

    const darkModeEnabled = useAutoDarkMode();
    const router = useRouter();

    // @ts-ignore
    const userInfo = useSubscribe<UserInfo>(rep, rep?.subscribe.getUserInfo(), undefined);

    const [isSignup, setIsSignup] = useState(false);
    useEffect(() => {
        (async () => {
            if (!rep || !user || !user.email) {
                return;
            }

            if (userInfo === null) {
                setIsSignup(true);
                console.log("Signing up new user", user);

                // fetch email subscription status
                const aiEnabled = await checkHasSubscription(user.id, user.email);
                await rep.mutate.updateUserInfo({
                    id: user.id,
                    name: user.user_metadata.name,
                    signinProvider: user.app_metadata.provider as any,
                    email: user.email,
                    accountEnabled: true,
                    aiEnabled,
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
            >
                <p>
                    Hey{userInfo.name && ` ${userInfo.name}`}, welcome to your Unclutter Library
                    account!
                </p>

                <p>
                    Your saved articles and highlights are now securely backed-up and available in
                    every browser where you sign in to this website.
                </p>
                <div className="flex gap-3">
                    <Button
                        title="Export data"
                        onClick={() => generateCSV(rep!)}
                        darkModeEnabled={darkModeEnabled}
                        reportEvent={reportEventPosthog}
                    />
                    <Button
                        title="Sign out"
                        onClick={async () => {
                            await supabaseClient.auth.signOut();
                            router.push("/");
                        }}
                        darkModeEnabled={darkModeEnabled}
                        reportEvent={reportEventPosthog}
                    />
                </div>
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

            <SettingsGroup
                title="AI Smart reading"
                icon={
                    <svg className="h-4 w-4" viewBox="0 0 576 512">
                        <path
                            fill="currentColor"
                            d="M248.8 4.994C249.9 1.99 252.8 .0001 256 .0001C259.2 .0001 262.1 1.99 263.2 4.994L277.3 42.67L315 56.79C318 57.92 320 60.79 320 64C320 67.21 318 70.08 315 71.21L277.3 85.33L263.2 123C262.1 126 259.2 128 256 128C252.8 128 249.9 126 248.8 123L234.7 85.33L196.1 71.21C193.1 70.08 192 67.21 192 64C192 60.79 193.1 57.92 196.1 56.79L234.7 42.67L248.8 4.994zM495.3 14.06L529.9 48.64C548.6 67.38 548.6 97.78 529.9 116.5L148.5 497.9C129.8 516.6 99.38 516.6 80.64 497.9L46.06 463.3C27.31 444.6 27.31 414.2 46.06 395.4L427.4 14.06C446.2-4.686 476.6-4.686 495.3 14.06V14.06zM461.4 48L351.7 157.7L386.2 192.3L495.1 82.58L461.4 48zM114.6 463.1L352.3 226.2L317.7 191.7L80 429.4L114.6 463.1zM7.491 117.2L64 96L85.19 39.49C86.88 34.98 91.19 32 96 32C100.8 32 105.1 34.98 106.8 39.49L128 96L184.5 117.2C189 118.9 192 123.2 192 128C192 132.8 189 137.1 184.5 138.8L128 160L106.8 216.5C105.1 221 100.8 224 96 224C91.19 224 86.88 221 85.19 216.5L64 160L7.491 138.8C2.985 137.1 0 132.8 0 128C0 123.2 2.985 118.9 7.491 117.2zM359.5 373.2L416 352L437.2 295.5C438.9 290.1 443.2 288 448 288C452.8 288 457.1 290.1 458.8 295.5L480 352L536.5 373.2C541 374.9 544 379.2 544 384C544 388.8 541 393.1 536.5 394.8L480 416L458.8 472.5C457.1 477 452.8 480 448 480C443.2 480 438.9 477 437.2 472.5L416 416L359.5 394.8C354.1 393.1 352 388.8 352 384C352 379.2 354.1 374.9 359.5 373.2z"
                        />
                    </svg>
                }
            >
                <p>
                    To help you make sense of what you read, Unclutter can automatically create,
                    organize, and surface article highlights for you.
                </p>
                <p>
                    That means you'll see all related perspectives and facts from your knowledge
                    base right next to each article. You do the thinking, Unclutter does the
                    information retrieval and organization.
                </p>
                <div className="flex gap-3">
                    {userInfo.aiEnabled ? (
                        <>
                            <Button
                                title="Manage subscription"
                                href="https://billing.stripe.com/p/login/5kA8x62Ap9y26v6144"
                                darkModeEnabled={darkModeEnabled}
                                reportEvent={reportEventPosthog}
                            />
                            <Button
                                title="Open tutorial"
                                href="/smart-reading"
                                inNewTab={false}
                                darkModeEnabled={darkModeEnabled}
                                reportEvent={reportEventPosthog}
                            />
                        </>
                    ) : (
                        <Button
                            title="Start trial"
                            href="https://buy.stripe.com/cN27vr1Dn5t84P6aEF"
                            inNewTab={false}
                            darkModeEnabled={darkModeEnabled}
                            reportEvent={reportEventPosthog}
                        />
                    )}
                </div>
            </SettingsGroup>
        </div>
    );
}
