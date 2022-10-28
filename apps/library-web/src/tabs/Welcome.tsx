import { useUser } from "@supabase/auth-helpers-react";
import {
    setUnclutterLibraryAuth,
    openArticleResilient,
    getBrowserType,
} from "@unclutter/library-components/dist/common";
import { getSettings } from "@unclutter/library-components/dist/store";
import clsx from "clsx";
import Image, { StaticImageData } from "next/image";
import { useContext, useEffect, useState } from "react";

import unclutterImage from "../assets/screenshots/unclutter.png";
import googleImage from "../assets/screenshots/google.png";
import searchImage from "../assets/screenshots/search.png";
import { Link } from "wouter";
import { ReplicacheContext } from "@unclutter/library-components/dist/store";

export default function WelcomeTab() {
    const rep = useContext(ReplicacheContext);
    const { user } = useUser();
    useEffect(() => {
        if (user) {
            setUnclutterLibraryAuth(user.id);
        }
    }, [user]);

    const [stage, setStageInternal] = useState<number>();
    const [savedStage, setSavedStage] = useState<number>(0);
    useEffect(() => {
        (async () => {
            const settings = await rep?.query.getSettings();
            setStageInternal(settings?.tutorial_stage ?? 0);
            setSavedStage(settings?.tutorial_stage ?? 0);
        })();
    }, []);
    async function setStage(index: number) {
        setStageInternal(index);
        await rep?.mutate.updateSettings({ tutorial_stage: index });
    }

    if (stage === undefined) {
        return <></>;
    }

    const unclutterLink =
        getBrowserType() === "firefox"
            ? "https://addons.mozilla.org/en-GB/firefox/addon/lindylearn"
            : "https://chrome.google.com/webstore/detail/ibckhpijbdmdobhhhodkceffdngnglpk";
    const unclutterLibraryLink =
        getBrowserType() === "firefox"
            ? "https://addons.mozilla.org/en-GB/firefox/addon/unclutter-library"
            : "https://chrome.google.com/webstore/detail/bghgkooimeljolohebojceacblokenjn";

    return (
        <div className=" font-text mb-10 flex flex-col gap-10 p-5 text-stone-900 dark:text-stone-200">
            <TutorialMessage index={0} stage={stage} savedStage={savedStage} setStage={setStage}>
                <h1 className="font-bold">Welcome to Unclutter Library!</h1>
                <p>
                    Your Library automatically organizes knowledge you read about for you. You won't
                    loose any links nor have to manually manage bookmark folders.
                </p>
                <p>There are 3 components to this:</p>
            </TutorialMessage>

            <TutorialMessage
                index={1}
                image={unclutterImage}
                stage={stage}
                savedStage={savedStage}
                setStage={setStage}
                actionButtons={
                    <>
                        <ActionButton
                            title="Try example"
                            onClick={() => openArticleResilient("http://paulgraham.com/vb.html")}
                        />
                    </>
                }
            >
                <p>
                    Most importantly, every article you open with the{" "}
                    <a
                        className="inline-block cursor-pointer font-bold transition-all hover:rotate-1"
                        href={unclutterLink}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Unclutter extension
                    </a>{" "}
                    will be automatically saved and categorized. There's a new UI element for this
                    above the outline in the top left.
                </p>
                <p>At the end of each page you'll see related articles from your library.</p>
                <p>If you have Unclutter installed, your account has been linked already.</p>
            </TutorialMessage>

            <TutorialMessage
                index={2}
                image={googleImage}
                stage={stage}
                savedStage={savedStage}
                setStage={setStage}
                actionButtons={
                    <>
                        <ActionButton
                            title="Install extension"
                            externalLink={unclutterLibraryLink}
                        />
                    </>
                }
            >
                <p>
                    There's a seperate{" "}
                    <a
                        className="inline-block cursor-pointer font-bold transition-all hover:-rotate-1"
                        href={unclutterLibraryLink}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Unclutter Library extension
                    </a>{" "}
                    to show your reading list on your new tab page, and matching articles from your
                    library on Google Search.
                </p>
                <p>
                    This downloads the full text of all your articles to your browser, so no queries
                    are sent over the network. You can also type "u " (for unclutter) in your
                    browser address bar to quickly find any saved article or reference within your
                    articles.
                </p>
            </TutorialMessage>

            <TutorialMessage
                index={3}
                image={searchImage}
                stage={stage}
                savedStage={savedStage}
                setStage={setStage}
                actionButtons={
                    <>
                        <ActionButton title="Browse library" internalPath="/" />
                        <ActionButton title="Import articles" internalPath="/import" primary />
                    </>
                }
            >
                <p>
                    Finally, <b className="inline-block font-bold">library.lindylearn.io</b> allows
                    you to browse and filter across your entire library. The topics used to group
                    articles are AI-generated specifically for you.
                </p>
                <p>
                    Right-click any article to add it to your favorites, or reorder lists with drag
                    &amp; drop. The yellow progress bars show how far you scrolled on each page.
                </p>
                <p>
                    You can also easily import articles from your browser bookmarks and Pocket,
                    Instapaper, or Raindrop account.
                </p>
            </TutorialMessage>
        </div>
    );
}

function TutorialMessage({
    index,
    image,
    children,
    actionButtons = null,
    stage,
    savedStage,
    setStage,
}: {
    index: number;
    image?: StaticImageData;
    children: React.ReactNode;
    actionButtons?: React.ReactNode;
    stage: number;
    savedStage: number;
    setStage: (stage: number) => void;
}) {
    // const topicColor = getRandomColor(`${index}`).replace("0.4)", "0.15)");

    if (index > stage) {
        return <></>;
    }

    return (
        <div
            className={clsx("flex gap-5", index > savedStage && "animate-slidein")}
            style={{
                animationDelay: `0`,
                animationFillMode: "both",
            }}
        >
            <div className={clsx("w-96", image && "")}>
                {image && (
                    <div
                        className="image h-max rounded-lg leading-none shadow dark:brightness-90"
                        // style={{ background: topicColor }}
                    >
                        <Image priority objectFit="contain" src={image} className="rounded-lg" />
                    </div>
                )}
            </div>

            <div>
                <div
                    className={clsx(
                        "relative col-span-2 flex h-max max-w-2xl items-start gap-3 rounded-lg bg-white p-3 px-4 shadow dark:bg-stone-800"
                    )}
                    // style={{ background: topicColor }}
                >
                    <div className="w-5 font-bold">{index > 0 && `${index}.`}</div>

                    <div className="relative flex flex-col gap-2">{children}</div>
                </div>
                {(actionButtons || (index === stage && stage < 3)) && (
                    <div className="mt-2 flex justify-start gap-2">
                        {actionButtons}
                        {index === stage && stage < 3 && (
                            <ActionButton
                                title="Next"
                                onClick={() => setStage(stage + 1)}
                                primary
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function ActionButton({
    title,
    internalPath,
    externalLink,
    onClick,
    primary = false,
}: {
    title: string;
    internalPath?: string;
    externalLink?: string;
    onClick?: () => void;
    primary?: boolean;
}) {
    const inner = (
        <div
            className={clsx(
                "font-title flex cursor-pointer items-center rounded-md bg-white px-2.5 py-0.5 text-stone-800 shadow transition-all hover:scale-95 dark:bg-stone-800 dark:text-stone-300"
            )}
        >
            {title}
            {primary && (
                <svg className="ml-1 h-4" viewBox="0 0 448 512">
                    <path
                        fill="currentColor"
                        d="M264.6 70.63l176 168c4.75 4.531 7.438 10.81 7.438 17.38s-2.688 12.84-7.438 17.38l-176 168c-9.594 9.125-24.78 8.781-33.94-.8125c-9.156-9.5-8.812-24.75 .8125-33.94l132.7-126.6H24.01c-13.25 0-24.01-10.76-24.01-24.01s10.76-23.99 24.01-23.99h340.1l-132.7-126.6C221.8 96.23 221.5 80.98 230.6 71.45C239.8 61.85 254.1 61.51 264.6 70.63z"
                    />
                </svg>
            )}
        </div>
    );

    if (onClick) {
        return <div onClick={onClick}>{inner}</div>;
    }
    if (internalPath) {
        return <Link href={internalPath}>{inner}</Link>;
    }
    if (externalLink) {
        return (
            <a href={externalLink} target="_blank" rel="noreferrer">
                {inner}
            </a>
        );
    }
    return inner;
}
