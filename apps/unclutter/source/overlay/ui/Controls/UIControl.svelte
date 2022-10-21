<script lang="ts">
    import Icon from "../Icon.svelte";

    export let iconName: string;
    // export let iconNameOnHover: string;
    export let tooltip: string;
    export let tooltipReverse: boolean = false;
    export let className: string = "";
    export let onClick: () => void = undefined;
</script>

<div
    class={"lindy-tooltp lindy-fade " +
        (tooltipReverse ? "lindy-tooltp-reverse " : "") +
        // (iconNameOnHover ? "hover-icon-change " : "") +
        className}
    data-title={tooltip}
    on:click={onClick}
>
    <Icon {iconName} />
    <!-- {#if iconNameOnHover}
        <Icon iconName={iconNameOnHover} />
    {/if} -->

    <slot />
</div>

<style global lang="postcss">
    .lindy-tooltp {
        position: relative !important;
        filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.05)) !important;

        cursor: pointer !important;
    }
    .lindy-tooltp:before,
    .lindy-tooltp:after {
        position: absolute !important;
        display: block !important;
        pointer-events: none !important;

        opacity: 0 !important;
    }
    .lindy-tooltp:before {
        /* box */
        top: 1px !important;
        right: calc(100% + 6px) !important;
        padding: 6px 8px !important;

        display: block !important;
        content: attr(data-title) !important;
        font-size: 14px !important;

        background: var(--background-color) !important;
        color: var(--text-color) !important;
        border-radius: 5px !important;
        white-space: nowrap !important;

        font-family: Poppins, sans-serif !important;
        font-weight: 600 !important;
    }
    .lindy-tooltp:after {
        /* arrow */
        top: 7px !important;
        right: calc(100% - 0px) !important;
        height: 0 !important;
        width: 0 !important;
        content: "" !important;

        border-top: 6px solid transparent !important;
        border-bottom: 6px solid transparent !important;
        border-left: 6px solid var(--background-color) !important;
    }

    .lindy-tooltp.lindy-fade:after,
    .lindy-tooltp.lindy-fade:before {
        transform: translate3d(10px, 0, 0) !important;
        transition: all 0.15s ease-out !important;
    }
    .lindy-tooltp.lindy-fade:hover:after,
    .lindy-tooltp.lindy-fade:hover:before {
        opacity: 1 !important;
        transform: translate3d(0, 0, 0) !important;
    }

    .lindy-tooltp-reverse:before {
        right: unset !important;
        left: calc(100% + 4px) !important;
        transform: translate3d(-10px, 0, 0) !important;

        line-height: 1.3 !important;
        padding-top: calc(6px - 0.15em) !important;
        padding-bottom: calc(6px - 0.15em) !important;

        white-space: break-spaces !important;
        width: max-content !important;
        max-width: 245px !important;
        box-sizing: border-box !important;
    }
    .lindy-tooltp-reverse:after {
        transform: translate3d(-10px, 0, 0) scaleX(-1) !important;
        right: -4px !important;
    }
    .lindy-tooltp-reverse.lindy-fade:hover:before {
        transform: translate3d(0, 0, 0) !important;
    }
    .lindy-tooltp-reverse.lindy-fade:hover:after {
        transform: translate3d(0, 0, 0) scaleX(-1) !important;
    }

    .hover-icon-change > .lindy-ui-icon:nth-child(2) {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;

        opacity: 0 !important;
    }
    .hover-icon-change:hover > .lindy-ui-icon:first-child {
        opacity: 0 !important;
    }
    .hover-icon-change:hover > .lindy-ui-icon:nth-child(2) {
        opacity: 1 !important;
    }
</style>
