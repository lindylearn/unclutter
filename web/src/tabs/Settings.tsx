import { supabaseClient } from "@supabase/auth-helpers-nextjs";
import { useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Link } from "wouter";
import { setUnclutterLibraryAuth } from "@unclutter/library-components/dist/common";

export default function SettingsTab({}) {
    const { user } = useUser();
    useEffect(() => {
        if (user) {
            setUnclutterLibraryAuth(user.id);
        }
    }, [user]);

    if (!user) {
        return <></>;
    }

    return (
        <div className="m-5 flex max-w-4xl flex-col gap-3">
            <AccountSettings user={user} />
        </div>
    );
}

function AccountSettings({ user }) {
    const router = useRouter();

    return (
        <div className="flex flex-col gap-2 text-sm md:text-base">
            <p>
                You're signed in as{" "}
                <span className="">
                    {user.user_metadata.name || user.email}
                </span>{" "}
                via {user.app_metadata.provider} login.{" "}
                <a
                    className="inline-block cursor-pointer font-bold transition-all hover:rotate-2"
                    onClick={async () => {
                        await supabaseClient.auth.signOut();
                        router.push("/");
                    }}
                >
                    Sign out
                </a>
            </p>
            <p>
                You can always{" "}
                <Link href="/import">
                    <a className="inline-block cursor-pointer font-bold transition-all hover:rotate-2">
                        import articles
                    </a>
                </Link>{" "}
                to your library or{" "}
                <Link href="/export">
                    <a className="inline-block cursor-pointer font-bold transition-all hover:-rotate-2">
                        export
                    </a>
                </Link>{" "}
                your data. See the welcome guide{" "}
                <Link href="/welcome">
                    <a className="inline-block cursor-pointer font-bold transition-all hover:-rotate-2">
                        here
                    </a>
                </Link>
                .
            </p>
            <p>
                Thank you for trying out the private beta! Please tell me what
                to improve via the chat bubble in the bottom right.
            </p>
        </div>
    );
}
