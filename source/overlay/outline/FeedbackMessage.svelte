<script lang="ts">
    import { reportEventContentScript } from "source/content-script/messaging";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();
</script>

<a
    class="feedback-container relative max-w-full cursor-pointer rounded-lg px-2 py-2 pr-5 shadow transition-all hover:shadow-md"
    href="https://unclutter.lindylearn.io/feedback"
    target="_blank"
    on:click={() => reportEventContentScript("clickFeedbackRequest")}
>
    <svg
        class="close-message absolute top-1.5 right-2 w-2.5 text-gray-400 opacity-70 transition-all hover:scale-110 hover:text-gray-700"
        viewBox="0 0 320 512"
        on:click={(e) => {
            dispatch("dismissed");
            e.preventDefault();
            return false;
        }}
    >
        <path
            fill="currentColor"
            d="M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z"
        />
    </svg>

    <div class="flex gap-2">
        <svg
            class="icon message-icon mx-1 w-5 flex-shrink-0"
            viewBox="0 0 512 512"
        >
            <path
                fill="currentColor"
                d="M244 84L255.1 96L267.1 84.02C300.6 51.37 347 36.51 392.6 44.1C461.5 55.58 512 115.2 512 185.1V190.9C512 232.4 494.8 272.1 464.4 300.4L283.7 469.1C276.2 476.1 266.3 480 256 480C245.7 480 235.8 476.1 228.3 469.1L47.59 300.4C17.23 272.1 0 232.4 0 190.9V185.1C0 115.2 50.52 55.58 119.4 44.1C164.1 36.51 211.4 51.37 244 84C243.1 84 244 84.01 244 84L244 84zM255.1 163.9L210.1 117.1C188.4 96.28 157.6 86.4 127.3 91.44C81.55 99.07 48 138.7 48 185.1V190.9C48 219.1 59.71 246.1 80.34 265.3L256 429.3L431.7 265.3C452.3 246.1 464 219.1 464 190.9V185.1C464 138.7 430.4 99.07 384.7 91.44C354.4 86.4 323.6 96.28 301.9 117.1L255.1 163.9z"
            />
        </svg>

        <span class="text-sm">
            How is Unclutter working for you? Let me know what to fix, improve,
            or add!
        </span>
    </div>
</a>

<style lang="postcss">
</style>
