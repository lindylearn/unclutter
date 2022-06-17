<script lang="ts">
    import Icon from "../Icon.svelte";

    export let iconName: string;
    export let tooltip: string;
    export let tooltipReverse: boolean = false;
    export let className: string = "";
    export let onClick: () => void = undefined;
</script>

<div
    class={"lindy-tooltp lindy-fade " +
        (tooltipReverse ? "lindy-tooltp-reverse " : " ") +
        className}
    data-title={tooltip}
    on:click={onClick}
>
    <Icon {iconName} />
    <slot />
</div>

<style lang="postcss">
    .lindy-tooltp {
        position: relative;
        filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.05));
    }
    .lindy-tooltp:before,
    .lindy-tooltp:after {
        position: absolute;
        display: block;
        pointer-events: none;

        opacity: 0;
    }
    .lindy-tooltp:before {
        /* box */
        top: 1px;
        right: calc(100% + 6px);
        padding: 6px 8px;

        display: block;
        content: attr(data-title);
        font-size: 13px;

        background: var(--background-color);
        color: var(--text-color);
        border-radius: 5px;
        white-space: nowrap;

        font-family: Poppins, sans-serif;
        font-weight: 600;
    }
    .lindy-tooltp:after {
        /* arrow */
        top: 7px;
        right: calc(100% - 0px);
        height: 0;
        width: 0;
        content: "";

        border-top: 6px solid transparent;
        border-bottom: 6px solid transparent;
        border-left: 6px solid var(--background-color);
    }

    .lindy-tooltp.lindy-fade:after,
    .lindy-tooltp.lindy-fade:before {
        transform: translate3d(10px, 0, 0);
        transition: all 0.15s ease-out;
    }
    .lindy-tooltp.lindy-fade:hover:after,
    .lindy-tooltp.lindy-fade:hover:before {
        opacity: 1;
        transform: translate3d(0, 0, 0);
    }

    .lindy-tooltp-reverse:before {
        right: unset;
        left: calc(100% + 4px);
        transform: translate3d(-10px, 0, 0) !important;

        line-height: 1.3;
        white-space: pre-wrap !important;
        /* word-break: break-all; */
        width: max-content;
        max-width: 250px;
    }
    .lindy-tooltp-reverse:after {
        transform: translate3d(-10px, 0, 0) scaleX(-1) !important;
        right: -4px;
    }
    .lindy-tooltp-reverse.lindy-fade:hover:before {
        transform: translate3d(0, 0, 0) !important;
    }
    .lindy-tooltp-reverse.lindy-fade:hover:after {
        transform: translate3d(0, 0, 0) scaleX(-1) !important;
    }
</style>
