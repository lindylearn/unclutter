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
        all: revert;
        position: absolute;
        top: -5px;
        right: calc(100% + 10px);
        z-index: 3000;

        background-color: var(--background-color) !important;
        color: #9ca3af !important;
        border-radius: 5px;
        filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.06)) drop-shadow(0 1px 2px rgb(0 0 0 / 0.05)); /* custom shadow, lighter than tw 'drop-shadow' */

        cursor: auto;

        visibility: hidden;
        opacity: 0;
        transform: translate3d(10px, 0, 0);
        transition: all 0.15s ease-out;
    }
    .lindy-ui-dialog-container:hover > .lindy-ui-dialog {
        visibility: visible;
        opacity: 1;
        transform: translate3d(0, 0, 0);
    }
    .lindy-default-open > .lindy-ui-dialog {
        visibility: visible;
        opacity: 1;
        transform: translate3d(0, 0, 0);
    }

    /* popup arrow */
    .lindy-ui-dialog:before {
        /* arrow */
        position: absolute;
        top: 10px;
        right: -8px;
        height: 0;
        width: 0;
        content: "";
        z-index: 2999;

        border-top: 8px solid transparent;
        border-bottom: 8px solid transparent;
        border-left: 8px solid var(--background-color);
    }
    /* spacer under arrow to avoid breaking hover state */
    .lindy-ui-dialog-container:hover:before {
        position: absolute;
        top: 0;
        right: 0;

        display: block;
        content: "";
        width: 200%;
        height: 150%;
        cursor: auto;
    }
</style>
