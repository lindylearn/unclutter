import React, { ReactNode } from "react";
import { getRandomLightColor } from "../../common";
import { ResourceIcon } from "./components/numbers";

const screenshotUrlBase = "https://library.lindylearn.io/upgrade/";
// const screenshotUrlBase = "http://localhost:3000/upgrade/";

export default function UpgradeModalTab({ darkModeEnabled }: { darkModeEnabled: boolean }) {
    return (
        <div className="flex min-h-full flex-col gap-4">
            <h1 className="flex items-center gap-2 py-1 px-1 font-medium">
                {/* <svg className="h-4" viewBox="0 0 512 512">
                    <path
                        fill="currentColor"
                        d="M244 84L255.1 96L267.1 84.02C300.6 51.37 347 36.51 392.6 44.1C461.5 55.58 512 115.2 512 185.1V190.9C512 232.4 494.8 272.1 464.4 300.4L283.7 469.1C276.2 476.1 266.3 480 256 480C245.7 480 235.8 476.1 228.3 469.1L47.59 300.4C17.23 272.1 0 232.4 0 190.9V185.1C0 115.2 50.52 55.58 119.4 44.1C164.1 36.51 211.4 51.37 244 84C243.1 84 244 84.01 244 84L244 84zM255.1 163.9L210.1 117.1C188.4 96.28 157.6 86.4 127.3 91.44C81.55 99.07 48 138.7 48 185.1V190.9C48 219.1 59.71 246.1 80.34 265.3L256 429.3L431.7 265.3C452.3 246.1 464 219.1 464 190.9V185.1C464 138.7 430.4 99.07 384.7 91.44C354.4 86.4 323.6 96.28 301.9 117.1L255.1 163.9z"
                    />
                </svg> */}
                Support the Unclutter development to unlock:
            </h1>
            <div className="grid list-disc grid-cols-2 gap-4">
                <FeatureCard
                    title="AI organization of your library"
                    imgSrc="topics.png"
                    icon={
                        <svg className="h-4" viewBox="0 0 448 512">
                            <path
                                fill="currentColor"
                                d="M88 32C110.1 32 128 49.91 128 72V120C128 142.1 110.1 160 88 160H40C17.91 160 0 142.1 0 120V72C0 49.91 17.91 32 40 32H88zM88 72H40V120H88V72zM88 192C110.1 192 128 209.9 128 232V280C128 302.1 110.1 320 88 320H40C17.91 320 0 302.1 0 280V232C0 209.9 17.91 192 40 192H88zM88 232H40V280H88V232zM0 392C0 369.9 17.91 352 40 352H88C110.1 352 128 369.9 128 392V440C128 462.1 110.1 480 88 480H40C17.91 480 0 462.1 0 440V392zM40 440H88V392H40V440zM248 32C270.1 32 288 49.91 288 72V120C288 142.1 270.1 160 248 160H200C177.9 160 160 142.1 160 120V72C160 49.91 177.9 32 200 32H248zM248 72H200V120H248V72zM160 232C160 209.9 177.9 192 200 192H248C270.1 192 288 209.9 288 232V280C288 302.1 270.1 320 248 320H200C177.9 320 160 302.1 160 280V232zM200 280H248V232H200V280zM248 352C270.1 352 288 369.9 288 392V440C288 462.1 270.1 480 248 480H200C177.9 480 160 462.1 160 440V392C160 369.9 177.9 352 200 352H248zM248 392H200V440H248V392zM320 72C320 49.91 337.9 32 360 32H408C430.1 32 448 49.91 448 72V120C448 142.1 430.1 160 408 160H360C337.9 160 320 142.1 320 120V72zM360 120H408V72H360V120zM408 192C430.1 192 448 209.9 448 232V280C448 302.1 430.1 320 408 320H360C337.9 320 320 302.1 320 280V232C320 209.9 337.9 192 360 192H408zM408 232H360V280H408V232zM320 392C320 369.9 337.9 352 360 352H408C430.1 352 448 369.9 448 392V440C448 462.1 430.1 480 408 480H360C337.9 480 320 462.1 320 440V392zM360 440H408V392H360V440z"
                            />
                        </svg>
                    }
                    darkModeEnabled={darkModeEnabled}
                />
                <FeatureCard
                    title="Graph view of related articles"
                    imgSrc="graph.png"
                    icon={<ResourceIcon type="links" />}
                    darkModeEnabled={darkModeEnabled}
                />
                <FeatureCard
                    title="Full-text search across all your articles"
                    imgSrc="google.png"
                    icon={
                        <svg viewBox="0 0 512 512" className="h-4">
                            <path
                                fill="currentColor"
                                d="M504.1 471l-134-134C399.1 301.5 415.1 256.8 415.1 208c0-114.9-93.13-208-208-208S-.0002 93.13-.0002 208S93.12 416 207.1 416c48.79 0 93.55-16.91 129-45.04l134 134C475.7 509.7 481.9 512 488 512s12.28-2.344 16.97-7.031C514.3 495.6 514.3 480.4 504.1 471zM48 208c0-88.22 71.78-160 160-160s160 71.78 160 160s-71.78 160-160 160S48 296.2 48 208z"
                            />
                        </svg>
                    }
                    darkModeEnabled={darkModeEnabled}
                />
                <FeatureCard
                    title="Back-up your library & import articles"
                    imgSrc="import.png"
                    icon={
                        <svg viewBox="0 0 512 512" className="h-4">
                            <path
                                fill="currentColor"
                                d="M481.2 33.81c-8.938-3.656-19.31-1.656-26.16 5.219l-50.51 50.51C364.3 53.81 312.1 32 256 32C157 32 68.53 98.31 40.91 193.3C37.19 206 44.5 219.3 57.22 223c12.81 3.781 26.06-3.625 29.75-16.31C108.7 132.1 178.2 80 256 80c43.12 0 83.35 16.42 114.7 43.4l-59.63 59.63c-6.875 6.875-8.906 17.19-5.219 26.16c3.719 8.969 12.47 14.81 22.19 14.81h143.9C485.2 223.1 496 213.3 496 200v-144C496 46.28 490.2 37.53 481.2 33.81zM454.7 288.1c-12.78-3.75-26.06 3.594-29.75 16.31C403.3 379.9 333.8 432 255.1 432c-43.12 0-83.38-16.42-114.7-43.41l59.62-59.62c6.875-6.875 8.891-17.03 5.203-26C202.4 294 193.7 288 183.1 288H40.05c-13.25 0-24.11 10.74-24.11 23.99v144c0 9.719 5.844 18.47 14.81 22.19C33.72 479.4 36.84 480 39.94 480c6.25 0 12.38-2.438 16.97-7.031l50.51-50.52C147.6 458.2 199.9 480 255.1 480c99 0 187.4-66.31 215.1-161.3C474.8 305.1 467.4 292.7 454.7 288.1z"
                            />
                        </svg>
                    }
                    darkModeEnabled={darkModeEnabled}
                />
            </div>

            {/* <div className="flex-grow" /> */}

            <div className="mt-4 flex gap-4">
                <a
                    className="flex cursor-pointer items-center gap-2 rounded-md bg-stone-50 px-3 py-2 font-medium transition-transform hover:scale-[97%] dark:bg-neutral-800"
                    href="https://opencollective.com/unclutter/contribute/supporter-46745"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {/* <svg className="h-4" viewBox="0 0 320 512">
                        <path
                            fill="currentColor"
                            d="M184 73.46C211.3 76.26 236.8 81.56 255.5 85.98C268.4 89.03 276.4 101.1 273.4 114.9C270.3 127.8 257.4 135.7 244.5 132.7C213.7 125.4 168.9 117 130.6 120.2C111.6 121.7 96.18 125.1 85.27 132.9C75.19 139.3 67.98 148.5 65.09 163.3C62.82 175 64.4 182.5 67.05 187.9C69.87 193.5 75.14 199.1 84.19 204.7C103.4 216.6 131.1 224.1 165.9 232.7L168.2 233.3C199.2 241.2 234.9 250.3 261.1 266.5C275 275.1 287.9 286.7 295.9 302.7C304 318.1 305.1 337.5 302 357.8C295.1 393.2 269.4 416.3 237.5 428.4C221.4 434.6 203.3 438.2 184 439.4V488C184 501.3 173.3 512 160 512C146.7 512 136 501.3 136 488V438.3C132.7 437.9 129.4 437.5 126.1 437.1L125.1 437C101.1 433.4 57.02 423.2 30.25 411.3C18.14 405.9 12.69 391.7 18.07 379.6C23.45 367.5 37.64 362 49.75 367.4C70.96 376.8 110.2 386.2 132.8 389.5C168.4 394.5 198.8 391.8 220.4 383.6C241.5 375.5 252.1 363.3 254.9 348.7C257.2 336.1 255.6 329.5 252.9 324.1C250.1 318.5 244.9 312.9 235.8 307.3C216.6 295.4 188 287.9 154.1 279.3L151.8 278.7C120.8 270.8 85.09 261.7 58.92 245.5C44.98 236.9 32.13 225.3 24.12 209.3C15.96 193 14.03 174.5 17.98 154.2C23.46 125.1 38.71 105.6 59.54 92.39C79.54 79.68 103.5 74.2 126.7 72.32C129.8 72.07 132.9 71.88 136 71.74V24C136 10.75 146.7 0 160 0C173.3 0 184 10.75 184 24L184 73.46z"
                        />
                    </svg> */}
                    Support on OpenCollective
                    <svg className="h-4" viewBox="0 0 448 512">
                        <path
                            fill="currentColor"
                            d="M280 80C266.7 80 256 69.25 256 56C256 42.75 266.7 32 280 32H424C437.3 32 448 42.75 448 56V200C448 213.3 437.3 224 424 224C410.7 224 400 213.3 400 200V113.9L200.1 312.1C191.6 322.3 176.4 322.3 167 312.1C157.7 303.6 157.7 288.4 167 279L366.1 80H280zM0 120C0 89.07 25.07 64 56 64H168C181.3 64 192 74.75 192 88C192 101.3 181.3 112 168 112H56C51.58 112 48 115.6 48 120V424C48 428.4 51.58 432 56 432H360C364.4 432 368 428.4 368 424V312C368 298.7 378.7 288 392 288C405.3 288 416 298.7 416 312V424C416 454.9 390.9 480 360 480H56C25.07 480 0 454.9 0 424V120z"
                        />
                    </svg>
                </a>
                {/* <a
                    className="flex cursor-pointer items-center gap-2 rounded-md bg-stone-50 px-3 py-2 font-medium transition-transform hover:scale-[97%] dark:bg-neutral-800"
                    href="https://opencollective.com/athens/contribute/user-25523"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    More information
                    <svg className="h-4" viewBox="0 0 448 512">
                        <path
                            fill="currentColor"
                            d="M280 80C266.7 80 256 69.25 256 56C256 42.75 266.7 32 280 32H424C437.3 32 448 42.75 448 56V200C448 213.3 437.3 224 424 224C410.7 224 400 213.3 400 200V113.9L200.1 312.1C191.6 322.3 176.4 322.3 167 312.1C157.7 303.6 157.7 288.4 167 279L366.1 80H280zM0 120C0 89.07 25.07 64 56 64H168C181.3 64 192 74.75 192 88C192 101.3 181.3 112 168 112H56C51.58 112 48 115.6 48 120V424C48 428.4 51.58 432 56 432H360C364.4 432 368 428.4 368 424V312C368 298.7 378.7 288 392 288C405.3 288 416 298.7 416 312V424C416 454.9 390.9 480 360 480H56C25.07 480 0 454.9 0 424V120z"
                        />
                    </svg>
                </a> */}
            </div>
        </div>
    );
}

function FeatureCard({
    title,
    icon,
    imgSrc,
    darkModeEnabled,
}: {
    title: string;
    icon: ReactNode;
    imgSrc: string;
    darkModeEnabled: boolean;
}) {
    return (
        <div
            className="rounded-md bg-stone-50 p-3 transition-transform hover:scale-[99%] dark:bg-neutral-800"
            style={{ background: getRandomLightColor(title, darkModeEnabled) }}
        >
            <h2 className="mb-3 flex items-center gap-2 px-1 font-medium">
                {icon}
                {title}
            </h2>
            <img
                className="h-40 w-full rounded-md object-cover object-left-top dark:brightness-90"
                src={`${screenshotUrlBase}${imgSrc}`}
            />
        </div>
    );
}
