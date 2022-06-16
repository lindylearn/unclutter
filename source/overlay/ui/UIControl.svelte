<script lang="ts">
    import Icon from "./Icon.svelte";

    export let iconName: string;
    export let tooltip: string;
    export let onClick: () => void = undefined;
</script>

<div class="lindy-tooltp lindy-fade" data-title={tooltip} on:click={onClick}>
    <Icon {iconName} />
</div>
