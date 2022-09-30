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
    "hsl(4.72, 100.00%, 75.10%)",
    "hsl(339.69, 100.00%, 75.10%)",
    "hsl(291.29, 95.38%, 74.51%)",
    "hsl(261.68, 100.00%, 76.67%)",
    "hsl(230.61, 100.00%, 77.45%)",
    "hsl(217.44, 100.00%, 75.49%)",
    "hsl(198.43, 100.00%, 75.10%)",
    "hsl(180.00, 100.00%, 75.88%)",
    "hsl(166.36, 100.00%, 82.75%)",
    "hsl(136.72, 77.22%, 84.51%)",
    "hsl(87.57, 100.00%, 78.24%)",
    "hsl(65.24, 100.00%, 75.29%)",
    "hsl(60.00, 100.00%, 77.65%)",
    "hsl(47.81, 100.00%, 74.90%)",
    "hsl(38.27, 100.00%, 75.10%)",
    "hsl(14.17, 100.00%, 75.10%)",
];

export function getRandomColor(seed: string): string {
    return _drawFromArray(seed, colors);
}

export function getRandomLightColor(seed: string): string {
    return _drawFromArray(seed, lightColors);
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
