import seedrandom from "seedrandom";
import { LindyAnnotation } from "./create";

// material UI colors A400 from https://materialui.co/colors/, with 30% opacity
export const colors = [
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

export function getAnnotationColor(annotation: LindyAnnotation): string {
    return getRandomColor(annotation.localId || annotation.id);
}

export function getRandomColor(seed: string) {
    return drawFromArray(seed, colors);
}

function randomInRange(seed, min, max) {
    // range 0..1
    const random = seedrandom(seed);

    // a..b (b exclusive)
    return Math.floor(random() * (max - min) + min);
}

function drawFromArray(seed, arr) {
    return arr[randomInRange(seed, 0, arr.length)];
}
