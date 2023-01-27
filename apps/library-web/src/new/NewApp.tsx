import { LindyIcon } from "@unclutter/library-components/dist/components";
import Head from "next/head";
import { useRouter } from "next/router";

import NewWelcomeTab from "./NewWelcome";
import SmartReadingOnboarding from "./Import";
import SmartReadingTab from "./SmartReading";
import ReviewTestTab from "../tabs/Review";

export default function App() {
    const router = useRouter();
    const pathName = router.asPath.split("?")[0];

    return (
        <div className="font-text min-h-screen bg-white p-6 text-stone-800 dark:bg-[#212121] dark:text-[rgb(232,230,227)]">
            <Head>
                <title>Your Unclutter Account</title>
            </Head>

            <aside className="absolute">
                <div
                    className="flex h-full w-32 cursor-pointer flex-col"
                    onClick={() => router.push("/")}
                >
                    <div className="mb-4 flex w-full items-center gap-2">
                        <LindyIcon className="w-8" />

                        <h1 className="font-title select-none text-2xl font-bold">Unclutter</h1>
                    </div>
                </div>
            </aside>

            <main className="mx-auto max-w-2xl">
                {pathName === "/" && <NewWelcomeTab />}
                {pathName === "/smart-reading" && <SmartReadingTab />}
                {pathName === "/import" && <SmartReadingOnboarding />}

                {/* {pathName === "/modal" && <ModalTestTab />} */}
                {pathName === "/review" && <ReviewTestTab />}
            </main>
        </div>
    );
}
