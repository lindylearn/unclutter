import { createPaymentsLink, useAutoDarkMode } from "@unclutter/library-components/dist/common";
import {
    SettingsButton,
    SettingsGroup,
} from "@unclutter/library-components/dist/components/Settings/SettingsGroup";
import {
    ReplicacheContext,
    UserInfo,
    useSubscribe,
} from "@unclutter/library-components/dist/store";
import Head from "next/head";
import { useContext, useEffect, useState } from "react";
import { reportEventPosthog } from "../../common/metrics";

export default function SmartReadingDetails() {
    const rep = useContext(ReplicacheContext);
    // @ts-ignore
    const userInfo = useSubscribe<UserInfo>(rep, rep?.subscribe.getUserInfo(), undefined);

    const darkModeEnabled = useAutoDarkMode();

    const [paymentsLink, setPaymentsLink] = useState<string>();
    useEffect(() => {
        if (!userInfo?.email || userInfo.aiEnabled) {
            return;
        }
        createPaymentsLink(userInfo.id, userInfo.email).then(setPaymentsLink);
    }, [userInfo]);

    return (
        <div className="animate-fadein flex flex-col gap-6">
            <Head>
                <title>AI Smart Reading</title>
            </Head>

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
                animationIndex={0}
            >
                <p>
                    To help you make sense of what you read, Unclutter can automatically create,
                    organize, and surface article highlights for you.
                </p>
                <p>Here's what that means exactly:</p>
            </SettingsGroup>

            <SettingsGroup
                title="Automatic highlights"
                icon={
                    <svg className="h-4 w-4" viewBox="0 0 576 512">
                        <path
                            fill="currentColor"
                            d="M248.8 4.994C249.9 1.99 252.8 .0001 256 .0001C259.2 .0001 262.1 1.99 263.2 4.994L277.3 42.67L315 56.79C318 57.92 320 60.79 320 64C320 67.21 318 70.08 315 71.21L277.3 85.33L263.2 123C262.1 126 259.2 128 256 128C252.8 128 249.9 126 248.8 123L234.7 85.33L196.1 71.21C193.1 70.08 192 67.21 192 64C192 60.79 193.1 57.92 196.1 56.79L234.7 42.67L248.8 4.994zM495.3 14.06L529.9 48.64C548.6 67.38 548.6 97.78 529.9 116.5L148.5 497.9C129.8 516.6 99.38 516.6 80.64 497.9L46.06 463.3C27.31 444.6 27.31 414.2 46.06 395.4L427.4 14.06C446.2-4.686 476.6-4.686 495.3 14.06V14.06zM461.4 48L351.7 157.7L386.2 192.3L495.1 82.58L461.4 48zM114.6 463.1L352.3 226.2L317.7 191.7L80 429.4L114.6 463.1zM7.491 117.2L64 96L85.19 39.49C86.88 34.98 91.19 32 96 32C100.8 32 105.1 34.98 106.8 39.49L128 96L184.5 117.2C189 118.9 192 123.2 192 128C192 132.8 189 137.1 184.5 138.8L128 160L106.8 216.5C105.1 221 100.8 224 96 224C91.19 224 86.88 221 85.19 216.5L64 160L7.491 138.8C2.985 137.1 0 132.8 0 128C0 123.2 2.985 118.9 7.491 117.2zM359.5 373.2L416 352L437.2 295.5C438.9 290.1 443.2 288 448 288C452.8 288 457.1 290.1 458.8 295.5L480 352L536.5 373.2C541 374.9 544 379.2 544 384C544 388.8 541 393.1 536.5 394.8L480 416L458.8 472.5C457.1 477 452.8 480 448 480C443.2 480 438.9 477 437.2 472.5L416 416L359.5 394.8C354.1 393.1 352 388.8 352 384C352 379.2 354.1 374.9 359.5 373.2z"
                        />
                    </svg>
                }
                imageSrc="media/1.png"
                animationIndex={1}
            >
                <p>
                    Unclutter automatically highlights important sentences on each article you read,
                    helping you focus on what matters.
                </p>
                <p>
                    All highlights are saved in your library just like any quotes you select
                    manually.
                    {/* The AI model for this runs in your local browser for privacy. */}
                </p>
            </SettingsGroup>

            <SettingsGroup
                title="Related ideas & facts"
                icon={
                    <svg className="h-4 w-4" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M425 182c-3.027 0-6.031 .1758-9 .5195V170C416 126.4 372.8 96 333.1 96h-4.519c.3457-2.969 .5193-5.973 .5193-9c0-48.79-43.92-87-100-87c-56.07 0-100 38.21-100 87c0 3.027 .1761 6.031 .5218 9h-56.52C33.2 96 0 129.2 0 170v66.21C0 253.8 6.77 269.9 17.85 282C6.77 294.1 0 310.2 0 327.8V438C0 478.8 33.2 512 73.1 512h110.2c17.63 0 33.72-6.77 45.79-17.85C242.1 505.2 258.2 512 275.8 512h58.21C372.8 512 416 481.6 416 438v-56.52c2.969 .3438 5.973 .5195 9 .5195C473.8 382 512 338.1 512 282S473.8 182 425 182zM425 334c-26.35 0-25.77-26-45.21-26C368.9 308 368 316.9 368 327.8V438c0 14.36-19.64 26-34 26h-58.21C264.9 464 256 455.1 256 444.2c0-19.25 25.1-18.88 25.1-45.21c0-21.54-23.28-39-52-39c-28.72 0-52 17.46-52 39c0 26.35 26 25.77 26 45.21C204 455.1 195.1 464 184.2 464H73.1C59.64 464 48 452.4 48 438v-110.2C48 316.9 56.86 308 67.79 308c19.25 0 18.88 26 45.21 26c21.54 0 39-23.28 39-52s-17.46-52-39-52C86.65 230 87.23 256 67.79 256C56.86 256 48 247.1 48 236.2V170C48 155.6 59.64 144 73.1 144h110.2C195.1 144 204 143.1 204 132.2c0-19.25-26-18.88-26-45.21c0-21.54 23.28-39 52-39c28.72 0 52 17.46 52 39C281.1 113.4 256 112.8 256 132.2C256 143.1 264.9 144 275.8 144h58.21C348.4 144 368 155.6 368 170v66.21C368 247.1 368.9 256 379.8 256c19.25 0 18.88-26 45.21-26c21.54 0 39 23.28 39 52S446.5 334 425 334z"
                        />
                    </svg>
                }
                imageSrc="media/2.png"
                animationIndex={2}
            >
                <p>
                    Next to each highlight, you'll see related highlight that you saved previously.
                    So you can make up your own mind by seeing ideas in different contexts.
                </p>
                <p>
                    Combined with the automatic highlights feature above, you just have to click the
                    Unclutter icon on a page to integrate it into your knowledge base.
                </p>
            </SettingsGroup>

            <SettingsGroup
                title="Search"
                icon={
                    <svg className="h-4 w-4" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M504.1 471l-134-134C399.1 301.5 415.1 256.8 415.1 208c0-114.9-93.13-208-208-208S-.0002 93.13-.0002 208S93.12 416 207.1 416c48.79 0 93.55-16.91 129-45.04l134 134C475.7 509.7 481.9 512 488 512s12.28-2.344 16.97-7.031C514.3 495.6 514.3 480.4 504.1 471zM48 208c0-88.22 71.78-160 160-160s160 71.78 160 160s-71.78 160-160 160S48 296.2 48 208z"
                        />
                    </svg>
                }
                imageSrc="media/3.png"
                animationIndex={3}
            >
                <p>
                    All saved knowledge is yours -- search across your highlights at any time to
                    find everything you know about a topic.
                </p>
                <p>Or sync your highlights with Hypothes.is and note-taking apps.</p>
            </SettingsGroup>

            <SettingsGroup
                title="Get started"
                icon={
                    <svg className="h-4 w-4" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M244 84L255.1 96L267.1 84.02C300.6 51.37 347 36.51 392.6 44.1C461.5 55.58 512 115.2 512 185.1V190.9C512 232.4 494.8 272.1 464.4 300.4L283.7 469.1C276.2 476.1 266.3 480 256 480C245.7 480 235.8 476.1 228.3 469.1L47.59 300.4C17.23 272.1 0 232.4 0 190.9V185.1C0 115.2 50.52 55.58 119.4 44.1C164.1 36.51 211.4 51.37 244 84C243.1 84 244 84.01 244 84L244 84zM255.1 163.9L210.1 117.1C188.4 96.28 157.6 86.4 127.3 91.44C81.55 99.07 48 138.7 48 185.1V190.9C48 219.1 59.71 246.1 80.34 265.3L256 429.3L431.7 265.3C452.3 246.1 464 219.1 464 190.9V185.1C464 138.7 430.4 99.07 384.7 91.44C354.4 86.4 323.6 96.28 301.9 117.1L255.1 163.9z"
                        />
                    </svg>
                }
                buttons={
                    userInfo?.aiEnabled ? (
                        <>
                            <SettingsButton
                                title="Manage subscription"
                                href="https://billing.stripe.com/p/login/5kA8x62Ap9y26v6144"
                                darkModeEnabled={darkModeEnabled}
                                reportEvent={reportEventPosthog}
                            />
                            <SettingsButton
                                title="Import articles"
                                href="/import"
                                inNewTab={false}
                                darkModeEnabled={darkModeEnabled}
                                reportEvent={reportEventPosthog}
                            />
                        </>
                    ) : (
                        <>
                            <SettingsButton
                                title="Start trial"
                                href={paymentsLink}
                                inNewTab={false}
                                darkModeEnabled={darkModeEnabled}
                                reportEvent={reportEventPosthog}
                            />
                        </>
                    )
                }
                animationIndex={4}
            >
                <p>Support the Unclutter open-source development to try this out.</p>
                <p>
                    Make use of the knowledge you've already accumulated by importing articles from
                    your Pocket, Instapaper, Raindrop, or browser bookmarks.
                </p>
            </SettingsGroup>
        </div>
    );
}
