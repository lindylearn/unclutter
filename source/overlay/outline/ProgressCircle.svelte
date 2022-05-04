<script lang="ts">
    import { reportEventContentScript } from 'source/content-script/messaging';
    import { createEventDispatcher } from 'svelte';

    // adapted from https://css-tricks.com/building-progress-ring-quickly/

    export let progressPercentage: number;
    export let caption: string;

    let strokeDashoffset: number;
    $: strokeDashoffset = 288.5 - 288.5 * progressPercentage;
</script>

<div class="relative font-header hover:drop-shadow-md cursor-pointer">
    <svg
        viewBox="0 0 100 100"
        class="progress-circle w-10"
    >
      <defs>
        <mask id="mask">
          <path 
            class="logoPath" 
            id="logo-path"
            style={`stroke-dashoffset: ${strokeDashoffset}`}
            d="M 50 96 a 46 46 0 0 1 0 -92 46 46 0 0 1 0 92" 
          />
        </mask>
      </defs>
      
      <path 
        class="placeholder"
        d="M 50 96 a 46 46 0 0 1 0 -92 46 46 0 0 1 0 92" 
      />

      <foreignObject class="logoWrap" mask="url(#mask)" x="0" y="0" width="100" height="100">
        <div class="logoGradient"></div>
      </foreignObject>
    </svg>

    <div class="absolute font-semibold select-none w-full text-center" style="top: 20%; left: 0;">
        {caption}
    </div>
</div>


<style lang="postcss">
  svg {
    transform-origin: bottom;
  }

  .logoWrap {
    transform-origin: 50px 50px;
  }

  .logoGradient {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: conic-gradient(
      rgba(255, 23, 68, 0.5),
      rgba(213, 0, 249, 0.5),
      rgba(61, 90, 254, 0.5),
      rgba(0, 176, 255, 0.5),
      rgba(29, 233, 182, 0.5),
      rgba(118, 255, 3, 0.5),
      rgba(255, 234, 0, 0.5),
      rgba(255, 145, 0, 0.5),
      rgba(255, 23, 68, 0.5)
    );
  }

  .logoPath {
    stroke: white;
    stroke-width: 12;
    stroke-linecap: round;
    fill: none;
    transform-origin: 50px 50px;
    transform: rotate(-180deg);
    transition: stroke-dashoffset 0.35s;

    stroke-dasharray: 288.5;
  }

  .placeholder {
    stroke: #f3f4f6;
    fill: var(--lindy-background-color);
    stroke-width: 6;
    transform-origin: 50px 50px;
  }

</style>
