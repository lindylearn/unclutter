export interface PageModifier {
    // animation phase hook
    fadeOutNoise?: () => Promise<void>;
    transitionIn?: () => Promise<void>;
    transitionOut?: () => Promise<void>;
    fadeInNoise?: () => Promise<void>;
}
