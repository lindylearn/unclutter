import { supabaseClient } from "@supabase/auth-helpers-nextjs";
import { useUser } from "@supabase/auth-helpers-react";
import { Auth } from "@supabase/ui";
import Head from "next/head";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import { useEffect } from "react";

import { LindyIcon } from "@unclutter/library-components/dist/components";

export default function LoginPage({ isSignup = false }) {
    const router = useRouter();
    const { user, error } = useUser();

    useEffect(() => {
        // on login success
        if (user) {
            posthog.identify(user.id, { email: user.email });
            router.push("/");
        }
    }, [user]);

    const origin = typeof window !== "undefined" ? window.location.origin : "";

    return (
        // dark:bg-[#212121] dark:text-[rgb(232,230,227)]
        <div className="min-h-screen bg-white p-10 text-stone-800">
            <Head>
                <title>Unclutter Login</title>
            </Head>

            <div className="mx-auto max-w-md">
                <div className="font-title flex items-center justify-center gap-3 text-4xl font-bold dark:text-stone-800">
                    <LindyIcon className="w-14" />
                    <h1>Unclutter</h1>
                </div>

                <div className="mt-20">
                    {error && <p>{error.message}</p>}

                    <Auth
                        supabaseClient={supabaseClient}
                        providers={["google", "github"]}
                        socialLayout="horizontal"
                        socialButtonSize="large"
                        redirectTo={origin}
                        view={isSignup ? "sign_up" : "sign_in"}
                    />
                </div>
            </div>
        </div>
    );
}
