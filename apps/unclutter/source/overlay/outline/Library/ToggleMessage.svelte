<script lang="ts">
    import { fly } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import clsx from "clsx";

    export let inactiveColor: string;
    export let activeColor: string;
    export let isActive: boolean;
    export let onToggle: () => void;
    export let onClick: () => void;
    export let darkModeEnabled: boolean;
</script>

<div
    class="toggle-message relative flex max-w-full cursor-pointer items-center justify-between gap-2 rounded-lg text-gray-800 shadow transition-transform hover:scale-[98%]"
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
            class="bottom-row mt-1 select-none overflow-ellipsis whitespace-pre text-gray-400 dark:text-stone-600"
        >
            <slot name="subtitle" />
        </div>

        <slot />
    </div>

    <div
        class={clsx(
            "toggle transition-color flex h-[calc(1rem+0.5rem+1.25rem+0.75rem*2)] shrink-0 origin-left items-center rounded-r-lg px-3",
            isActive ? "active" : "inactive",
            darkModeEnabled && "dark"
        )}
        style={`--inactive-color: ${inactiveColor}; --active-color: ${activeColor};`}
        on:click={onToggle}
    >
        <slot name="toggle-icon" />
    </div>
</div>

<style lang="postcss">
    .toggle-message {
        /* background transition overrides transform otherwise */
        transition: background 0.3s ease-in-out 0.1s, transform 0.2s ease-in-out !important;
    }

    .toggle {
        transition: background 0.2s ease-in-out !important;
    }
    .toggle.inactive {
        background: var(--inactive-color) !important;
    }
    .toggle.active {
        background: var(--active-color) !important;
    }
    .toggle.inactive:hover {
        background: var(--active-color) !important;
    }
</style>
