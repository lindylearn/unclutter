import React, { ReactNode, useContext, useEffect, useRef, useState } from "react";
import { latestSettingsVersion, ReplicacheContext, RuntimeReplicache, Settings } from "../../store";
import { getActivityColor } from "../Charts";
import { ModalStateContext } from "./context";
import { SettingsButton, SettingsGroup } from "../Settings/SettingsGroup";
import { SmartReadingPreview } from "../Settings/SmartReading";
import { generateCSV } from "../Settings/account";

export default function AboutModalTab({}: {}) {
    const { darkModeEnabled, userInfo, showSignup, reportEvent } = useContext(ModalStateContext);

    return (
        <div className="animate-fadein flex flex-col gap-4">
            <SettingsGroup
                title="About"
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
                    Hey{userInfo?.email && ` ${userInfo?.email}`}, welcome to your Unclutter library
                    account!
                </p>

                <p>
                    You can access your library at any time by visiting my.unclutter.it, pressing
                    TAB inside the reader mode, right-clicking the Unclutter extension icon, or by
                    installing the Unclutter New Tab extension.
                </p>
            </SettingsGroup>

            <SettingsGroup
                title="Save articles"
                icon={
                    <svg className="h-4" viewBox="0 0 576 512">
                        <path
                            fill="currentColor"
                            d="M540.9 56.77C493.8 39.74 449.6 31.58 410.9 32.02C352.2 32.96 308.3 50 288 59.74C267.7 50 223.9 32.98 165.2 32.04C125.8 31.35 82.18 39.72 35.1 56.77C14.02 64.41 0 84.67 0 107.2v292.1c0 16.61 7.594 31.95 20.84 42.08c13.73 10.53 31.34 13.91 48.2 9.344c118.1-32 202 22.92 205.5 25.2C278.6 478.6 283.3 480 287.1 480s9.37-1.359 13.43-4.078c3.516-2.328 87.59-57.21 205.5-25.25c16.92 4.563 34.5 1.188 48.22-9.344C568.4 431.2 576 415.9 576 399.2V107.2C576 84.67 561.1 64.41 540.9 56.77zM264 416.8c-27.86-11.61-69.84-24.13-121.4-24.13c-26.39 0-55.28 3.281-86.08 11.61C53.19 405.3 50.84 403.9 50 403.2C48 401.7 48 399.8 48 399.2V107.2c0-2.297 1.516-4.531 3.594-5.282c40.95-14.8 79.61-22.36 112.8-21.84C211.3 80.78 246.8 93.75 264 101.5V416.8zM528 399.2c0 .5938 0 2.422-2 3.969c-.8438 .6407-3.141 2.063-6.516 1.109c-90.98-24.6-165.4-5.032-207.5 12.53v-315.3c17.2-7.782 52.69-20.74 99.59-21.47c32.69-.5157 71.88 7.047 112.8 21.84C526.5 102.6 528 104.9 528 107.2V399.2z"
                        />
                    </svg>
                }
            >
                <p>
                    Every article you open with Unclutter automatically gets saved in your library.
                </p>
                <p>
                    Get back to articles you didn't finish yet, access your reading queue on another
                    device, or see what you've read recently via the Stats and Articles pages.
                </p>
            </SettingsGroup>

            <SettingsGroup
                title="Read faster"
                icon={
                    <svg className="h-4 w-4" viewBox="0 0 576 512">
                        <path
                            fill="currentColor"
                            d="M248.8 4.994C249.9 1.99 252.8 .0001 256 .0001C259.2 .0001 262.1 1.99 263.2 4.994L277.3 42.67L315 56.79C318 57.92 320 60.79 320 64C320 67.21 318 70.08 315 71.21L277.3 85.33L263.2 123C262.1 126 259.2 128 256 128C252.8 128 249.9 126 248.8 123L234.7 85.33L196.1 71.21C193.1 70.08 192 67.21 192 64C192 60.79 193.1 57.92 196.1 56.79L234.7 42.67L248.8 4.994zM495.3 14.06L529.9 48.64C548.6 67.38 548.6 97.78 529.9 116.5L148.5 497.9C129.8 516.6 99.38 516.6 80.64 497.9L46.06 463.3C27.31 444.6 27.31 414.2 46.06 395.4L427.4 14.06C446.2-4.686 476.6-4.686 495.3 14.06V14.06zM461.4 48L351.7 157.7L386.2 192.3L495.1 82.58L461.4 48zM114.6 463.1L352.3 226.2L317.7 191.7L80 429.4L114.6 463.1zM7.491 117.2L64 96L85.19 39.49C86.88 34.98 91.19 32 96 32C100.8 32 105.1 34.98 106.8 39.49L128 96L184.5 117.2C189 118.9 192 123.2 192 128C192 132.8 189 137.1 184.5 138.8L128 160L106.8 216.5C105.1 221 100.8 224 96 224C91.19 224 86.88 221 85.19 216.5L64 160L7.491 138.8C2.985 137.1 0 132.8 0 128C0 123.2 2.985 118.9 7.491 117.2zM359.5 373.2L416 352L437.2 295.5C438.9 290.1 443.2 288 448 288C452.8 288 457.1 290.1 458.8 295.5L480 352L536.5 373.2C541 374.9 544 379.2 544 384C544 388.8 541 393.1 536.5 394.8L480 416L458.8 472.5C457.1 477 452.8 480 448 480C443.2 480 438.9 477 437.2 472.5L416 416L359.5 394.8C354.1 393.1 352 388.8 352 384C352 379.2 354.1 374.9 359.5 373.2z"
                        />
                    </svg>
                }
                imageSrc="https://my.unclutter.it/media/1.png"
                animationIndex={1}
            >
                <p>
                    From now on, Unclutter automatically highlights the most important sentences on
                    each article you read in yellow, helping you focus on what matters.
                </p>
            </SettingsGroup>

            <SettingsGroup
                title="Save quotes"
                icon={
                    <svg className="w-4" viewBox="0 0 448 512">
                        <path
                            fill="currentColor"
                            d="M296 160c-30.93 0-56 25.07-56 56s25.07 56 56 56c2.74 0 5.365-.4258 8-.8066V280c0 13.23-10.77 24-24 24C266.8 304 256 314.8 256 328S266.8 352 280 352C319.7 352 352 319.7 352 280v-64C352 185.1 326.9 160 296 160zM152 160C121.1 160 96 185.1 96 216S121.1 272 152 272C154.7 272 157.4 271.6 160 271.2V280C160 293.2 149.2 304 136 304c-13.25 0-24 10.75-24 24S122.8 352 136 352C175.7 352 208 319.7 208 280v-64C208 185.1 182.9 160 152 160zM384 32H64C28.65 32 0 60.65 0 96v320c0 35.35 28.65 64 64 64h320c35.35 0 64-28.65 64-64V96C448 60.65 419.3 32 384 32zM400 416c0 8.822-7.178 16-16 16H64c-8.822 0-16-7.178-16-16V96c0-8.822 7.178-16 16-16h320c8.822 0 16 7.178 16 16V416z"
                        />
                    </svg>
                }
                imageSrc="https://my.unclutter.it/media/3.png"
            >
                <p>
                    Click on any yellow highlight to save it to your library, or manually select
                    text.
                </p>
                <p>
                    All such quotes are tagged and organized automatically. On the Quotes page you
                    can browse and search across all information you've collected this way.
                </p>
            </SettingsGroup>

            <SettingsGroup
                title="Connect ideas"
                icon={
                    <svg className="h-4 w-4" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M425 182c-3.027 0-6.031 .1758-9 .5195V170C416 126.4 372.8 96 333.1 96h-4.519c.3457-2.969 .5193-5.973 .5193-9c0-48.79-43.92-87-100-87c-56.07 0-100 38.21-100 87c0 3.027 .1761 6.031 .5218 9h-56.52C33.2 96 0 129.2 0 170v66.21C0 253.8 6.77 269.9 17.85 282C6.77 294.1 0 310.2 0 327.8V438C0 478.8 33.2 512 73.1 512h110.2c17.63 0 33.72-6.77 45.79-17.85C242.1 505.2 258.2 512 275.8 512h58.21C372.8 512 416 481.6 416 438v-56.52c2.969 .3438 5.973 .5195 9 .5195C473.8 382 512 338.1 512 282S473.8 182 425 182zM425 334c-26.35 0-25.77-26-45.21-26C368.9 308 368 316.9 368 327.8V438c0 14.36-19.64 26-34 26h-58.21C264.9 464 256 455.1 256 444.2c0-19.25 25.1-18.88 25.1-45.21c0-21.54-23.28-39-52-39c-28.72 0-52 17.46-52 39c0 26.35 26 25.77 26 45.21C204 455.1 195.1 464 184.2 464H73.1C59.64 464 48 452.4 48 438v-110.2C48 316.9 56.86 308 67.79 308c19.25 0 18.88 26 45.21 26c21.54 0 39-23.28 39-52s-17.46-52-39-52C86.65 230 87.23 256 67.79 256C56.86 256 48 247.1 48 236.2V170C48 155.6 59.64 144 73.1 144h110.2C195.1 144 204 143.1 204 132.2c0-19.25-26-18.88-26-45.21c0-21.54 23.28-39 52-39c28.72 0 52 17.46 52 39C281.1 113.4 256 112.8 256 132.2C256 143.1 264.9 144 275.8 144h58.21C348.4 144 368 155.6 368 170v66.21C368 247.1 368.9 256 379.8 256c19.25 0 18.88-26 45.21-26c21.54 0 39 23.28 39 52S446.5 334 425 334z"
                        />
                    </svg>
                }
                imageSrc="https://my.unclutter.it/media/2.png"
            >
                <p>
                    Quotes from your library also automatically appear whenever you save a related
                    quote on another article, helping you connect similar ideas.
                </p>
                <p>
                    For example, if a text mentions Google's business model, you'll see everything
                    you've read about that topic right next to it.
                </p>
            </SettingsGroup>

            <SettingsGroup
                title="Import articles"
                icon={
                    <svg className="h-4 w-4" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M481.2 33.81c-8.938-3.656-19.31-1.656-26.16 5.219l-50.51 50.51C364.3 53.81 312.1 32 256 32C157 32 68.53 98.31 40.91 193.3C37.19 206 44.5 219.3 57.22 223c12.81 3.781 26.06-3.625 29.75-16.31C108.7 132.1 178.2 80 256 80c43.12 0 83.35 16.42 114.7 43.4l-59.63 59.63c-6.875 6.875-8.906 17.19-5.219 26.16c3.719 8.969 12.47 14.81 22.19 14.81h143.9C485.2 223.1 496 213.3 496 200v-144C496 46.28 490.2 37.53 481.2 33.81zM454.7 288.1c-12.78-3.75-26.06 3.594-29.75 16.31C403.3 379.9 333.8 432 255.1 432c-43.12 0-83.38-16.42-114.7-43.41l59.62-59.62c6.875-6.875 8.891-17.03 5.203-26C202.4 294 193.7 288 183.1 288H40.05c-13.25 0-24.11 10.74-24.11 23.99v144c0 9.719 5.844 18.47 14.81 22.19C33.72 479.4 36.84 480 39.94 480c6.25 0 12.38-2.438 16.97-7.031l50.51-50.52C147.6 458.2 199.9 480 255.1 480c99 0 187.4-66.31 215.1-161.3C474.8 305.1 467.4 292.7 454.7 288.1z"
                        />
                    </svg>
                }
            >
                <p>The more you read, the more value you'll get out of Unclutter.</p>
                <p>
                    On the Import page you can import articles to make use of the knowledge you've
                    already saved with Pocket, Instapaper, Raindrop, or your browser bookmarks.
                </p>
            </SettingsGroup>
        </div>
    );
}
