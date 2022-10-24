<script lang="ts">
    import clsx from "clsx";

    export let value: number;

    let lastValue: number | null = null;
    let diff: number | null = null;
    $: {
        onValueChange(value);
    }
    function onValueChange(value: number) {
        if (lastValue === null) {
            lastValue = value;
        } else if (lastValue !== value) {
            diff = value - lastValue;
            lastValue = value;

            setTimeout(() => {
                diff = null;
            }, 500);
        }
    }
</script>

<div class={clsx("animated-number relative", diff !== null && "animate", diff < 0 && "reverse")}>
    <div class="after-value">{value}</div>
    <div class="before-value absolute top-0 left-0 h-full w-full">
        {value - (diff || 0)}
    </div>
</div>

<style>
    .animated-number:not(.animate) > .before-value {
        opacity: 0;
    }
    .animated-number.animate > .before-value {
        animation: animateNumberOut 0.4s cubic-bezier(0.5, 1, 0.89, 1); /* easeOutQuad */
        animation-fill-mode: both;
    }
    .animated-number.animate.reverse > .before-value {
        animation-name: animateNumberOutReverse;
    }
    .animated-number.animate > .after-value {
        animation: animateNumberIn 0.4s cubic-bezier(0.5, 1, 0.89, 1); /* easeOutQuad */
        animation-fill-mode: both;
    }
    .animated-number.animate.reverse > .after-value {
        animation-name: animateNumberInReverse;
    }
    @keyframes animateNumberOut {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-20px);
        }
    }
    @keyframes animateNumberOutReverse {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(20px);
        }
    }
    @keyframes animateNumberIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    @keyframes animateNumberInReverse {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
