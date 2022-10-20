import seedrandom from "seedrandom";

// material UI colors A4XX from https://materialui.co/colors/ with 40% opacity
export const colors = [
    "rgba(255, 23, 68, 0.4)",
    "rgba(245, 0, 87, 0.4)",
    "rgba(213, 0, 249, 0.4)",
    "rgba(101, 31, 255, 0.4)",
    "rgba(61, 90, 254, 0.4)",
    "rgba(41, 121, 255, 0.4)",
    "rgba(0, 176, 255, 0.4)",
    "rgba(0, 229, 255, 0.4)",
    "rgba(29, 233, 182, 0.4)",
    "rgba(0, 230, 118, 0.4)",
    "rgba(118, 255, 3, 0.4)",
    "rgba(198, 255, 0, 0.4)",
    "rgba(255, 234, 0, 0.4)",
    "rgba(255, 196, 0, 0.4)",
    "rgba(255, 145, 0, 0.4)",
    "rgba(255, 61, 0, 0.4)",
];

// material UI colors A1XX from https://materialui.co/colors/
export const lightColors = [
    "rgba(255, 138, 128, 1.0)",
    "rgba(255, 128, 171, 1.0)",
    "rgba(234, 128, 252, 1.0)",
    "rgba(179, 136, 255, 1.0)",
    "rgba(140, 158, 255, 1.0)",
    "rgba(130, 177, 255, 1.0)",
    "rgba(128, 216, 255, 1.0)",
    "rgba(132, 255, 255, 1.0)",
    "rgba(167, 255, 235, 1.0)",
    "rgba(185, 246, 202, 1.0)",
    "rgba(204, 255, 144, 1.0)",
    // "rgba(244, 255, 129, 1.0)",
    // "rgba(255, 255, 141, 1.0)",
    "rgba(255, 229, 127, 1.0)",
    "rgba(255, 209, 128, 1.0)",
    "rgba(255, 158, 128, 1.0)",
];

export function getRandomColor(seed: string): string {
    return _drawFromArray(seed, colors);
}

export function getRandomLightColor(seed: string, darkModeEnabled: boolean = false): string {
    const color = _drawFromArray(seed, lightColors);
    return darkModeEnabled ? color.replace("1.0", "0.5") : color;
}

// *** helpers ***

function _drawFromArray(seed, arr) {
    return arr[_randomInRange(seed, 0, arr.length)];
}

function _randomInRange(seed, min, max) {
    // range 0..1
    const random = seedrandom(seed);

    // a..b (b exclusive)
    return Math.floor(random() * (max - min) + min);
}
