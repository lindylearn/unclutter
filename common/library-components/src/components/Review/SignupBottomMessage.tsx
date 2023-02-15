import React, { useContext, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { ReplicacheContext, UserInfo } from "../../store";
import { LindyIcon } from "../Icons";

export default function SignupBottomMessage({
    articleId,
    darkModeEnabled,
    reportEvent = () => {},
}: {
    articleId: string;
    darkModeEnabled: boolean;
    reportEvent?: (event: string, data?: any) => void;
}) {
    const rep = useContext(ReplicacheContext);
    const [userInfo, setUserInfo] = useState<UserInfo | null>();
    useEffect(() => {
        rep?.query.getUserInfo().then(setUserInfo);
    }, [rep]);

    const { ref } = useInView({
        triggerOnce: true,
        onChange: (inView) => {
            if (inView) {
                reportEvent("seeBottomSignupMessage");
            }
        },
    });

    return (
        <a
            className="bottom-content bottom-review flex flex-col gap-[8px] text-stone-800 transition-all hover:scale-[99%] dark:text-[rgb(232,230,227)]"
            onClick={() => reportEvent("clickBottomSignupMessage")}
            href={
                userInfo?.accountEnabled
                    ? "https://my.unclutter.it/smart-reading"
                    : "https://my.unclutter.it/signup"
            }
            target="_blank"
            rel="noreferrer"
            ref={ref}
        >
            <CardContainer>
                <div className="flex w-full items-start gap-2">
                    <div className="w-full">
                        <div className="font-title mx-auto mb-2 flex w-max items-center gap-2 text-lg font-semibold">
                            <LindyIcon className="w-6 shrink-0" />
                            Create an account to enable more features
                        </div>

                        <ul className="mx-auto grid w-max grid-cols-2 items-center gap-y-1 gap-x-4">
                            <BulletPoint
                                icon={
                                    <svg className="h-4 w-4" viewBox="0 0 576 512">
                                        <path
                                            fill="currentColor"
                                            d="M540.9 56.77C493.8 39.74 449.6 31.58 410.9 32.02C352.2 32.96 308.3 50 288 59.74C267.7 50 223.9 32.98 165.2 32.04C125.8 31.35 82.18 39.72 35.1 56.77C14.02 64.41 0 84.67 0 107.2v292.1c0 16.61 7.594 31.95 20.84 42.08c13.73 10.53 31.34 13.91 48.2 9.344c118.1-32 202 22.92 205.5 25.2C278.6 478.6 283.3 480 287.1 480s9.37-1.359 13.43-4.078c3.516-2.328 87.59-57.21 205.5-25.25c16.92 4.563 34.5 1.188 48.22-9.344C568.4 431.2 576 415.9 576 399.2V107.2C576 84.67 561.1 64.41 540.9 56.77zM264 416.8c-27.86-11.61-69.84-24.13-121.4-24.13c-26.39 0-55.28 3.281-86.08 11.61C53.19 405.3 50.84 403.9 50 403.2C48 401.7 48 399.8 48 399.2V107.2c0-2.297 1.516-4.531 3.594-5.282c40.95-14.8 79.61-22.36 112.8-21.84C211.3 80.78 246.8 93.75 264 101.5V416.8zM528 399.2c0 .5938 0 2.422-2 3.969c-.8438 .6407-3.141 2.063-6.516 1.109c-90.98-24.6-165.4-5.032-207.5 12.53v-315.3c17.2-7.782 52.69-20.74 99.59-21.47c32.69-.5157 71.88 7.047 112.8 21.84C526.5 102.6 528 104.9 528 107.2V399.2z"
                                        />
                                    </svg>
                                }
                                text="Manage articles you want to read"
                            />
                            <BulletPoint
                                icon={
                                    <svg className="h-4 w-4" viewBox="0 0 576 512">
                                        <path
                                            fill="currentColor"
                                            d="M248.8 4.994C249.9 1.99 252.8 .0001 256 .0001C259.2 .0001 262.1 1.99 263.2 4.994L277.3 42.67L315 56.79C318 57.92 320 60.79 320 64C320 67.21 318 70.08 315 71.21L277.3 85.33L263.2 123C262.1 126 259.2 128 256 128C252.8 128 249.9 126 248.8 123L234.7 85.33L196.1 71.21C193.1 70.08 192 67.21 192 64C192 60.79 193.1 57.92 196.1 56.79L234.7 42.67L248.8 4.994zM495.3 14.06L529.9 48.64C548.6 67.38 548.6 97.78 529.9 116.5L148.5 497.9C129.8 516.6 99.38 516.6 80.64 497.9L46.06 463.3C27.31 444.6 27.31 414.2 46.06 395.4L427.4 14.06C446.2-4.686 476.6-4.686 495.3 14.06V14.06zM461.4 48L351.7 157.7L386.2 192.3L495.1 82.58L461.4 48zM114.6 463.1L352.3 226.2L317.7 191.7L80 429.4L114.6 463.1zM7.491 117.2L64 96L85.19 39.49C86.88 34.98 91.19 32 96 32C100.8 32 105.1 34.98 106.8 39.49L128 96L184.5 117.2C189 118.9 192 123.2 192 128C192 132.8 189 137.1 184.5 138.8L128 160L106.8 216.5C105.1 221 100.8 224 96 224C91.19 224 86.88 221 85.19 216.5L64 160L7.491 138.8C2.985 137.1 0 132.8 0 128C0 123.2 2.985 118.9 7.491 117.2zM359.5 373.2L416 352L437.2 295.5C438.9 290.1 443.2 288 448 288C452.8 288 457.1 290.1 458.8 295.5L480 352L536.5 373.2C541 374.9 544 379.2 544 384C544 388.8 541 393.1 536.5 394.8L480 416L458.8 472.5C457.1 477 452.8 480 448 480C443.2 480 438.9 477 437.2 472.5L416 416L359.5 394.8C354.1 393.1 352 388.8 352 384C352 379.2 354.1 374.9 359.5 373.2z"
                                        />
                                    </svg>
                                }
                                text="Read faster with AI highlights"
                            />
                            <BulletPoint
                                icon={
                                    <svg className="h-4 w-4" viewBox="0 0 512 512">
                                        <path
                                            fill="currentColor"
                                            d="M504.1 471l-134-134C399.1 301.5 415.1 256.8 415.1 208c0-114.9-93.13-208-208-208S-.0002 93.13-.0002 208S93.12 416 207.1 416c48.79 0 93.55-16.91 129-45.04l134 134C475.7 509.7 481.9 512 488 512s12.28-2.344 16.97-7.031C514.3 495.6 514.3 480.4 504.1 471zM48 208c0-88.22 71.78-160 160-160s160 71.78 160 160s-71.78 160-160 160S48 296.2 48 208z"
                                        />
                                    </svg>
                                }
                                text="Search across your knowledge base"
                            />

                            <BulletPoint
                                icon={
                                    <svg className="h-4 w-4" viewBox="0 0 448 512">
                                        <path
                                            fill="currentColor"
                                            d="M296 160c-30.93 0-56 25.07-56 56s25.07 56 56 56c2.74 0 5.365-.4258 8-.8066V280c0 13.23-10.77 24-24 24C266.8 304 256 314.8 256 328S266.8 352 280 352C319.7 352 352 319.7 352 280v-64C352 185.1 326.9 160 296 160zM152 160C121.1 160 96 185.1 96 216S121.1 272 152 272C154.7 272 157.4 271.6 160 271.2V280C160 293.2 149.2 304 136 304c-13.25 0-24 10.75-24 24S122.8 352 136 352C175.7 352 208 319.7 208 280v-64C208 185.1 182.9 160 152 160zM384 32H64C28.65 32 0 60.65 0 96v320c0 35.35 28.65 64 64 64h320c35.35 0 64-28.65 64-64V96C448 60.65 419.3 32 384 32zM400 416c0 8.822-7.178 16-16 16H64c-8.822 0-16-7.178-16-16V96c0-8.822 7.178-16 16-16h320c8.822 0 16 7.178 16 16V416z"
                                        />
                                    </svg>
                                }
                                text="Collect quotes with AI tagging"
                            />
                            <BulletPoint
                                icon={
                                    <svg className="h-4 w-4" viewBox="0 0 448 512">
                                        <path
                                            fill="currentColor"
                                            d="M240 32C266.5 32 288 53.49 288 80V432C288 458.5 266.5 480 240 480H208C181.5 480 160 458.5 160 432V80C160 53.49 181.5 32 208 32H240zM240 80H208V432H240V80zM80 224C106.5 224 128 245.5 128 272V432C128 458.5 106.5 480 80 480H48C21.49 480 0 458.5 0 432V272C0 245.5 21.49 224 48 224H80zM80 272H48V432H80V272zM320 144C320 117.5 341.5 96 368 96H400C426.5 96 448 117.5 448 144V432C448 458.5 426.5 480 400 480H368C341.5 480 320 458.5 320 432V144zM368 432H400V144H368V432z"
                                        />
                                    </svg>
                                }
                                text="See your reading statistics"
                            />
                            <BulletPoint
                                icon={
                                    <svg className="h-4 w-4" viewBox="0 0 512 512">
                                        <path
                                            fill="currentColor"
                                            d="M425 182c-3.027 0-6.031 .1758-9 .5195V170C416 126.4 372.8 96 333.1 96h-4.519c.3457-2.969 .5193-5.973 .5193-9c0-48.79-43.92-87-100-87c-56.07 0-100 38.21-100 87c0 3.027 .1761 6.031 .5218 9h-56.52C33.2 96 0 129.2 0 170v66.21C0 253.8 6.77 269.9 17.85 282C6.77 294.1 0 310.2 0 327.8V438C0 478.8 33.2 512 73.1 512h110.2c17.63 0 33.72-6.77 45.79-17.85C242.1 505.2 258.2 512 275.8 512h58.21C372.8 512 416 481.6 416 438v-56.52c2.969 .3438 5.973 .5195 9 .5195C473.8 382 512 338.1 512 282S473.8 182 425 182zM425 334c-26.35 0-25.77-26-45.21-26C368.9 308 368 316.9 368 327.8V438c0 14.36-19.64 26-34 26h-58.21C264.9 464 256 455.1 256 444.2c0-19.25 25.1-18.88 25.1-45.21c0-21.54-23.28-39-52-39c-28.72 0-52 17.46-52 39c0 26.35 26 25.77 26 45.21C204 455.1 195.1 464 184.2 464H73.1C59.64 464 48 452.4 48 438v-110.2C48 316.9 56.86 308 67.79 308c19.25 0 18.88 26 45.21 26c21.54 0 39-23.28 39-52s-17.46-52-39-52C86.65 230 87.23 256 67.79 256C56.86 256 48 247.1 48 236.2V170C48 155.6 59.64 144 73.1 144h110.2C195.1 144 204 143.1 204 132.2c0-19.25-26-18.88-26-45.21c0-21.54 23.28-39 52-39c28.72 0 52 17.46 52 39C281.1 113.4 256 112.8 256 132.2C256 143.1 264.9 144 275.8 144h58.21C348.4 144 368 155.6 368 170v66.21C368 247.1 368.9 256 379.8 256c19.25 0 18.88-26 45.21-26c21.54 0 39 23.28 39 52S446.5 334 425 334z"
                                        />
                                    </svg>
                                }
                                text="Connect ideas across articles"
                            />
                        </ul>
                    </div>
                </div>
            </CardContainer>
        </a>
    );
}

function BulletPoint({ icon, text }) {
    return (
        <li className="flex items-center gap-2">
            {icon}
            <p>{text}</p>
        </li>
    );
}

function CardContainer({ children }) {
    return (
        <div
            className="relative mx-auto flex w-[var(--lindy-pagewidth)] items-start gap-4 overflow-hidden rounded-lg bg-white p-4 py-3 shadow dark:bg-[#212121] "
            // bg-white dark:bg-[#212121]
            // bg-gradient-to-b from-yellow-300 to-amber-400
            // style={{ backgroundImage: "linear-gradient(150deg, var(--tw-gradient-stops))" }}
        >
            {children}
        </div>
    );
}
