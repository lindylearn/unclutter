export interface PageModifier {
    prepare?: (...args: any[]) => Promise<void>;

    // Visibly hide noisy elements and meanwhile perform heavy operation
    fadeOutNoise?: (...args: any[]) => void;

    // Shift layout and reduce page width in one go
    transitionIn?: (...args: any[]) => void;

    afterTransitionIn?: (...args: any[]) => void;

    // undo all modifications (including css rewrites and style changes)
    transitionOut?: (...args: any[]) => void;

    fadeInNoise?: (...args: any[]) => void;

    afterTransitionOut?: (...args: any[]) => void;
}

// wrap class
const trackedMethods = new Set([
    "prepare",
    "transitionIn",
    "prepareAnimation",
    "executeAnimation",
    "afterTransitionIn",
    "beforeTransitionOut",
    "executeReverseAnimation",
    "transitionOut",
    "afterTransitionOut",
]);

// TODO catch async errors?
export function trackModifierExecution(target: Function) {
    const className = target.name;
    const descriptors = Object.getOwnPropertyDescriptors(target.prototype);
    for (const [propName, descriptor] of Object.entries(descriptors)) {
        const isMethod = typeof descriptor.value == "function" && propName != "constructor";

        if (!isMethod) continue;
        if (!trackedMethods.has(propName)) continue;

        const originalMethod = descriptor.value;
        descriptor.value = function (...args: any[]) {
            try {
                return originalMethod.apply(this, args);
            } catch (error) {
                console.error(error);
                return undefined;
            }
        };

        Object.defineProperty(target.prototype, propName, descriptor);
    }
}
