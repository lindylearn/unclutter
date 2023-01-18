import { useUser } from "@supabase/auth-helpers-react";
import {
    setUnclutterLibraryAuth,
    checkHasSubscription,
} from "@unclutter/library-components/dist/common";
import { useContext, useEffect, useState } from "react";
import {
    ReplicacheContext,
    UserInfo,
    useSubscribe,
} from "@unclutter/library-components/dist/store";
import Head from "next/head";
import { reportEventPosthog } from "../../common/metrics";
import Link from "next/link";
import { LindyIcon } from "@unclutter/library-components/dist/components";

export default function Welcome2Tab() {
    const rep = useContext(ReplicacheContext);
    const { user } = useUser();

    // @ts-ignore
    const userInfo = useSubscribe<UserInfo>(rep, rep?.subscribe.getUserInfo(), undefined);

    const [isSignup, setIsSignup] = useState(false);
    useEffect(() => {
        (async () => {
            if (!rep || !user || !user.email) {
                return;
            }

            console.log(userInfo);
            if (userInfo === null) {
                setIsSignup(true);
                console.log("Signing up new user...");

                // fetch email subscription status
                const aiEnabled = await checkHasSubscription(user.id, user.email);
                await rep.mutate.updateUserInfo({
                    id: user.id,
                    name: undefined,
                    signinProvider: user.app_metadata.provider as any,
                    email: user.email,
                    accountEnabled: true,
                    aiEnabled,
                });
                await new Promise((resolve) => setTimeout(resolve, 2000));

                setUnclutterLibraryAuth(user.id);
            } else {
                console.log("Loggin in existing user...");
                setUnclutterLibraryAuth(user.id);
            }
        })();
    }, [rep, user, userInfo]);

    if (!userInfo) {
        return <></>;
    }

    return (
        <div className="font-text mx-auto mt-3 flex max-w-3xl flex-col gap-4 p-5 text-stone-900 dark:text-stone-200">
            <Head>
                <title>Your Unclutter Library</title>
            </Head>
            {/* <header className="font-title top-3 left-3 flex gap-2 text-2xl font-bold">
                <LindyIcon className="w-8" /> Unclutter
            </header> */}

            {isSignup ? (
                <>
                    <h1>You successfully created an Unclutter account!</h1>

                    <p>
                        From now on, articles you read with the Unclutter extension are available
                        everywhere you sign in to this website.
                    </p>

                    <p>
                        Your existing articles are currently being analyzed and categorized, which
                        takes a few minutes. To see the categorization status and import more
                        articles, see the{" "}
                        <Link href="/import">
                            <a className="inline-block cursor-pointer font-medium underline underline-offset-2 transition-all hover:scale-[98%]">
                                import page
                            </a>
                        </Link>
                        .
                    </p>
                </>
            ) : (
                <>
                    <h1>You successfully logged in!</h1>

                    <p>Access your library from inside the Unclutter extension.</p>

                    <p>
                        To import more articles, see the{" "}
                        <Link href="/import">
                            <a className="inline-block cursor-pointer font-medium underline underline-offset-2 transition-all hover:scale-[98%]">
                                import page
                            </a>
                        </Link>
                        .
                    </p>
                </>
            )}

            {userInfo?.onPaidPlan && (
                <p>
                    Seriously thank you for the financial support! This project wouldn't be possible
                    without it. For any questions or ideas, just create a{" "}
                    <a
                        className="inline-block cursor-pointer font-medium underline underline-offset-2 transition-all hover:scale-[98%]"
                        href="https://github.com/lindylearn/unclutter/issues"
                        target="_blank"
                        rel="noreferrer"
                    >
                        GitHub issue
                    </a>{" "}
                    or email{" "}
                    <a
                        className="inline-block cursor-pointer font-medium underline underline-offset-2 transition-all hover:scale-[98%]"
                        href="mailto:peter@lindylearn.io"
                        target="_blank"
                        rel="noreferrer"
                    >
                        peter@lindylearn.io
                    </a>
                    .
                </p>
            )}
        </div>
    );
}
