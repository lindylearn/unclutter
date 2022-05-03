<script lang="ts">
    import { reportEventContentScript } from 'source/content-script/messaging';
    import { createEventDispatcher } from 'svelte';

    // adapted from https://css-tricks.com/building-progress-ring-quickly/

    export let progress: number;
    export let caption: string;

    const radius = 20;
    const stroke = 4;
    
    const normalizedRadius = radius - stroke;
    const circumference = normalizedRadius * 2 * Math.PI;

    let strokeDashoffset: number;
    $: strokeDashoffset = circumference - progress / 100 * circumference;
</script>

<div class="relative font-header hover:drop-shadow-md">
    <svg
        height={radius * 2}
        width={radius * 2}
        class=""
    >
        <defs>
            <linearGradient id="myGradient" gradientTransform="">
                <stop offset="5%"  stop-color="rgba(255, 23, 68, 0.6)" />
                <stop offset="15%" stop-color="rgba(213, 0, 249, 0.6)" />
                <stop offset="25%" stop-color="rgba(61, 90, 254, 0.6)" />
                <stop offset="35%" stop-color="rgba(0, 176, 255, 0.6)" />
                <stop offset="45%" stop-color="rgba(29, 233, 182, 0.6)" />
                <stop offset="55%" stop-color="rgba(118, 255, 3, 0.6)" />
                <stop offset="65%" stop-color="rgba(255, 234, 0, 0.6)" />
                <stop offset="95%" stop-color="rgba(255, 145, 0, 0.6)" />
            </linearGradient>
        </defs>
        <circle
            stroke="#f3f4f6"
            fill="white"
            stroke-width={ stroke }
            r={ normalizedRadius }
            cx={ radius }
            cy={ radius }
        />
        <circle
            stroke="url('#myGradient')"
            fill="transparent"
            stroke-dasharray={ circumference + ' ' + circumference }
            style={`stroke-dashoffset: ${strokeDashoffset}`}
            stroke-width={ stroke }
            r={ normalizedRadius }
            cx={ radius }
            cy={ radius }
        />
    </svg>

    <div class="absolute font-semibold select-none" style="top: 20%; left: 38%;">
        {caption}
    </div>
</div>


<style lang="postcss">
    /* html, body {
    background-color: #2962FF;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    position: relative;
    } */

    circle {
        transition: stroke-dashoffset 0.35s;
        transform: rotate(-90deg);
        transform-origin: 50% 50%;
        stroke-linecap: round;
    }
</style>
