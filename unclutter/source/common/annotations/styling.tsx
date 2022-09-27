import seedrandom from "seedrandom";
import { LindyAnnotation } from "./create";

// material UI colors A400 from https://materialui.co/colors/, with 30% opacity
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
    "rgba(198, 255, 0, 0.3)",
    "rgba(255, 234, 0, 0.3)",
    "rgba(255, 196, 0, 0.3)",
    "rgba(255, 145, 0, 0.3)",
    "rgba(255, 61, 0, 0.3)",
];

export function getAnnotationColor(annotation: LindyAnnotation): string {
    return getRandomColor(annotation.quote_text || annotation.text);
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

export function ColoredText({ text, className = "" }) {
    return (
        <span
            className={"leading-none " + className}
            style={{
                backgroundColor: getAnnotationColor({ quote_text: text }),
            }}
        >
            {text}
        </span>
    );
}
