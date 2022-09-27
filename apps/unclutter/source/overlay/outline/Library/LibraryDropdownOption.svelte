<script lang="ts">
    import clsx from "clsx";

    export let title: string;
    export let top: boolean = false;
    export let bottom: boolean = false;
</script>

<div
    class={clsx(
        "px-2 py-0.5 hover:bg-stone-100 outline-none transition-all w-max",
        top && "pt-1 rounded-t",
        bottom && "pb-1 rounded-b"
    )}
>
    <slot name="icon" />
    {title}
</div>
