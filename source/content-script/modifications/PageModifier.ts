export interface PageModifier {
    // animation phase hook
    fadeOutNoise?: () => Promise<void>;
    transitionIn?: () => Promise<void>;
    transitionOut?: () => Promise<void>;
    fadeInNoise?: () => Promise<void>;
}

// let start = performance.now();
// const [hideNoise, enableResponsiveStyle, restoreOriginalStyle] =
//     await iterateCSSOM(themeName);
// let duration = performance.now() - start;
// console.log(`Took ${Math.round(duration)}ms to iterate CSSOM`);
