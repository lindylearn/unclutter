<script lang="ts">
    import clsx from "clsx";
    import Icon from "../Icon.svelte";

    export let iconName: string;
    export let defaultOpen: boolean = false;
</script>

<div
    class={clsx(
        "lindy-ui-dialog-container lindy-overlay-elem",
        defaultOpen && "lindy-default-open"
    )}
>
    <Icon {iconName} />
    <div class="lindy-ui-dialog lindy-overlay-elem"><slot /></div>
</div>

<style lang="postcss">
    .lindy-ui-dialog-container {
        position: relative !important;
        z-index: 3000 !important;
    }

    /* dialog box */
    .lindy-ui-dialog {
        all: revert !important;
        position: absolute !important;
        top: -5px !important;
        right: calc(100% + 10px) !important;
        z-index: 3000 !important;

        background-color: var(--background-color) !important;
        color: #a8a29e !important;
        border-radius: 6px !important;
        filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.1)) drop-shadow(0 1px 1px rgb(0 0 0 / 0.06)) !important; /* drop-shadow */

        cursor: auto !important;

        visibility: hidden !important;
        opacity: 0 !important;
        transform: translate3d(10px, 0, 0) !important;
        transition: all 200ms ease-out !important;
    }
    .lindy-ui-dialog-container:hover > .lindy-ui-dialog {
        visibility: visible !important;
        opacity: 1 !important;
        transform: translate3d(0, 0, 0) !important;
    }
    .lindy-default-open > .lindy-ui-dialog {
        visibility: visible !important;
        opacity: 1 !important;
        transform: translate3d(0, 0, 0) !important;
    }

    /* popup arrow */
    .lindy-ui-dialog:before {
        /* arrow */
        position: absolute !important;
        top: 10px !important;
        right: -8px !important;
        height: 0 !important;
        width: 0 !important;
        content: "" !important;
        z-index: 2999 !important;

        border-top: 8px solid transparent !important;
        border-bottom: 8px solid transparent !important;
        border-left: 8px solid var(--background-color) !important;
    }
    /* spacer under arrow to avoid breaking hover state */
    .lindy-ui-dialog-container:hover:before {
        position: absolute !important;
        top: 0 !important;
        right: 0 !important;

        display: block !important;
        content: "" !important;
        width: 200% !important;
        height: 150% !important;
        cursor: auto !important;
    }
</style>
