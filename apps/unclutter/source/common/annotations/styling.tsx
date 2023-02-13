import seedrandom from "seedrandom";
import { LindyAnnotation } from "./create";

// always keep transparency for blending into site background (& dark mode)
export const colors = [
    "rgba(255, 23, 68, 0.3)",
    "rgba(245, 0, 87, 0.3)",
    "rgba(213, 0, 249, 0.3)",
    "rgba(101, 31, 255, 0.3)",
    "rgba(61, 90, 254, 0.3)",
    "rgba(41, 121, 255, 0.3)",
    "rgba(0, 176, 255, 0.3)",
    "rgba(0, 229, 255, 0.3)",
    "rgba(29, 233, 182, 0.3)",
    "rgba(0, 230, 118, 0.3)",
    "rgba(118, 255, 3, 0.3)",
    // "rgba(198, 255, 0, 0.3)",
    // "rgba(255, 234, 0, 0.3)",
    // "rgba(255, 196, 0, 0.3)",
    // "rgba(255, 145, 0, 0.3)",
    "rgba(255, 61, 0, 0.3)",
];

export function getAnnotationColor(annotation: LindyAnnotation): string {
    return getRandomColor(annotation.relatedToId || annotation.id);
}

export function getAnnotationColorNew(annotation: LindyAnnotation): [string, string] {
    let color: string;
    let colorDark: string;

    if (annotation.tags && annotation.tags.length > 0) {
        color = getRandomColor(annotation.tags[0]);
        colorDark = color.replace("0.3", "0.6");
    } else if (annotation.platform === "hn") {
        color = "rgba(255, 102, 0, 0.5)";
        colorDark = color.replace("0.5", "0.8");
    } else if (annotation.platform === "h") {
        color = "rgba(189, 28, 43, 0.5)";
        colorDark = color.replace("0.5", "0.8");
    } else {
        // yellow
        color = "rgba(250, 204, 21, 0.3)";
        colorDark = color.replace("0.3", "0.6");
    }

    return [color, colorDark];
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

export function drawFromArray(seed, arr) {
    return arr[randomInRange(seed, 0, arr.length)];
}
