<script lang="ts">
    import { fly, slide } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import clsx from "clsx";

    export let inactiveColor: string = undefined;
    export let activeColor: string;
    export let isActive: boolean;
    export let onToggle: () => void;
    export let onClick: () => void;
    export let darkModeEnabled: boolean;
</script>

<div
    class="toggle-message relative flex max-w-full cursor-pointer items-center justify-between gap-2 rounded-lg text-gray-800 shadow transition-transform hover:scale-[98%]"
    transition:slide={{ duration: 300, easing: cubicOut }}
>
    <div
        class="content relative flex h-[calc(2*0.75rem+1.25rem+0.25rem+1.25rem)] flex-grow flex-col overflow-hidden whitespace-nowrap py-3 pl-4 text-sm"
        in:fly={{ y: 10, duration: 300, easing: cubicOut }}
        on:click={onClick}
    >
        <div
            class="top-row font-title select-none overflow-ellipsis whitespace-pre text-base font-semibold leading-tight"
        >
            <slot name="title" />
        </div>

        <div
            class="bottom-row mt-1 select-none overflow-ellipsis whitespace-pre text-stone-400 dark:text-stone-600"
        >
            <slot name="subtitle" />
        </div>

        <slot />
    </div>

    <!-- <div
        class={clsx(
            "toggle transition-color flex h-[calc(1rem+0.5rem+1.25rem+0.75rem*2)] shrink-0 origin-left items-center rounded-r-lg px-3 w-12 relative bg-gray-50 dark:bg-neutral-800",
            isActive ? "active" : "inactive",
            darkModeEnabled && "dark"
        )}
        style={`--inactive-color: ${inactiveColor}; --active-color: ${activeColor};`}
        on:click={onToggle}
    >
        <div
            class="active-icon absolute top-0 left-0 flex h-full w-full items-center justify-center opacity-100"
        >
            <slot name="toggle-icon" />
        </div>

        <div
            class="inactive-icon absolute top-0 left-0 flex h-full w-full items-center justify-center opacity-100"
        >
            <svg class="mx-0.5 w-5" viewBox="0 0 448 512">
                <path
                    fill="currentColor"
                    d="M432 256C432 269.3 421.3 280 408 280h-160v160c0 13.25-10.75 24.01-24 24.01S200 453.3 200 440v-160h-160c-13.25 0-24-10.74-24-23.99C16 242.8 26.75 232 40 232h160v-160c0-13.25 10.75-23.99 24-23.99S248 58.75 248 72v160h160C421.3 232 432 242.8 432 256z"
                />
            </svg>
        </div>
    </div> -->
</div>

<style lang="postcss">
    .toggle-message {
        /* background transition overrides transform otherwise */
        transition: background 0.3s ease-in-out 0.1s, transform 0.2s ease-in-out !important;
    }

    .toggle {
        transition: background 0.2s ease-in-out !important;
    }
    /* .toggle.inactive {
        background: var(--inactive-color) !important;
    } */
    .toggle.active {
        background: var(--active-color) !important;
    }
    .toggle.inactive:hover {
        background: var(--active-color) !important;
    }

    .toggle > * {
        transition: opacity 0.2s ease-in-out !important;
    }
    .toggle.inactive > .active-icon {
        opacity: 0 !important;
    }
    .toggle.active > .inactive-icon {
        opacity: 0 !important;
    }
    .toggle.inactive:hover > .inactive-icon {
        opacity: 0 !important;
    }
    .toggle.inactive:hover > .active-icon {
        opacity: 1 !important;
    }
</style>
