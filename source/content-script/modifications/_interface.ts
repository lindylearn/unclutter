export interface PageModifier {
    prepare?: (...args: any[]) => Promise<void>;

    // Visibly hide noisy elements and meanwhile perform heavy operation
    fadeOutNoise?: (...args: any[]) => void;

    // Shift layout and reduce page width in one go
    transitionIn?: (...args: any[]) => void;

    afterTransitionIn?: (...args: any[]) => Promise<void>;

    // undo all modifications (including css rewrites and style changes)
    transitionOut?: (...args: any[]) => Promise<void>;

    fadeInNoise?: (...args: any[]) => Promise<void>;

    afterTransitionOut?: (...args: any[]) => Promise<void>;
}

// wrap class
const trackedMethods = new Set([
    "prepare",
    "fadeOutNoise",
    "transitionIn",
    "afterTransitionIn",
    "transitionOut",
    "fadeInNoise",
]);
export function trackModifierExecution(target: Function) {
    const className = target.name;
    const descriptors = Object.getOwnPropertyDescriptors(target.prototype);
    for (const [propName, descriptor] of Object.entries(descriptors)) {
        const isMethod =
            typeof descriptor.value == "function" && propName != "constructor";

        if (!isMethod) continue;
        if (!trackedMethods.has(propName)) continue;

        const originalMethod = descriptor.value;
        descriptor.value = async function (...args: any[]) {
            if (className === "TransitionManager") {
                console.log(`.${propName}()`);
            }

            const start = performance.now();
            const result = await originalMethod.apply(this, args);

            // seems to break animation, only enable to measure layout performance in dev
            // await new Promise((r) => setTimeout(r, 0));

            const duration = performance.now() - start;

            if (className === "TransitionManager") {
                console.log(`${Math.round(duration)}ms`);
            } else {
                console.log(
                    `    ${className.padEnd(25)} ${Math.round(duration)}ms`
                );
            }

            return result;
        };

        Object.defineProperty(target.prototype, propName, descriptor);
    }
}
