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
</div>
