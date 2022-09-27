import { supabaseClient } from "@supabase/auth-helpers-nextjs";
import { useUser } from "@supabase/auth-helpers-react";
import { Auth } from "@supabase/ui";
import Head from "next/head";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import { useEffect } from "react";
import { setUnclutterLibraryAuth } from "@unclutter/library-components/dist/common";
import { LindyIcon } from "@unclutter/library-components/dist/components";

export default function LoginPage({ isSignup = false }) {
    const router = useRouter();
    const { user, error } = useUser();

    useEffect(() => {
        if (user) {
            setUnclutterLibraryAuth(user.id);
            posthog.identify(user.id, { email: user.email });

            router.push("/");
        }
    }, [user]);

    const origin = typeof window !== "undefined" ? window.location.origin : "";

    return (
        <div className="bg-background min-h-screen p-10">
            <Head>
                <title>Unclutter Library Login</title>
            </Head>

            <div className="mx-auto max-w-md">
                <div className="font-title flex cursor-pointer items-center justify-center gap-3 text-3xl font-bold dark:text-stone-900">
                    <LindyIcon className="w-11" />
                    <h1>Unclutter Library</h1>
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
