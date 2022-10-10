<script lang="ts">
    export let value: number;
    export let diff: number;
</script>

<div class="animated-number relative">
    <div class="after-value">{value}</div>
    <div class="before-value absolute top-0 left-0 h-full w-full">
        {value - diff}
    </div>
</div>

<style>
    .animated-number > .before-value {
        animation: animateNumberOut 0.4s cubic-bezier(0.5, 1, 0.89, 1) 0.5s; /* easeOutQuad */
        animation-fill-mode: both;
    }
    .animated-number > .after-value {
        animation: animateNumberIn 0.4s cubic-bezier(0.5, 1, 0.89, 1) 0.5s; /* easeOutQuad */
        animation-fill-mode: both;
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
</style>
