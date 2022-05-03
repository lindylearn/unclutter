<script lang="ts">
    import { reportEventContentScript } from "../../content-script/messaging";
    import { scrollToElement } from "./common";
    import { OutlineItem } from "./parse";

    export let index: number;
    export let title: string;
    export let element: Element;
    export let children: OutlineItem[];

    export let activeOutlineIndex: number;

    let activateStateClass = ""
    $: if (children.length !== 0 && activeOutlineIndex > index && activeOutlineIndex <= children[children.length - 1].index) {
        // active parent
        // not completely correctly, e.g. on https://blog.adamchalmers.com/making-a-dns-client/
        activateStateClass = "visited"
    } else if (index === activeOutlineIndex) {
        // active
        activateStateClass = "is-active font-header"
    } else if (index < activeOutlineIndex) {
        // visited
        activateStateClass = "visited"
    } else if (index > activeOutlineIndex) {
        activateStateClass = ""
    }

    function focusHeading() {
        // TODO can remove this here?
        // if (!element.id) {
        //     // create id for linking
        //     element.id = title.toLowerCase().split(" ").slice(0, 5).join("-")

        //     // TODO strip non-alphanumeric
        // }
        // history.replaceState(null, null, `#${element.id}`);

        scrollToElement(element)

        reportEventContentScript("clickOutlineHeading")
    }
</script>

<li class="heading">
    <div class={"heading-text relative text-sm cursor-pointer flex w-full gap-2 justify-between items-start " + activateStateClass} on:click={focusHeading}>
        <svg class="absolute active-dot hidden" style="width: 6px;" viewBox="0 0 320 512">
            <path fill="currentColor" d="M320 256C320 344.4 248.4 416 160 416C71.63 416 0 344.4 0 256C0 167.6 71.63 96 160 96C248.4 96 320 167.6 320 256z"/>
        </svg>
        <div class="title">{title}</div>

        {#if index !== -1}
            <div class="px-1 rounded font-header" style="background-color: rgba(0, 230, 118, 0.3);">2</div>
        {/if}
    </div>
    {#if children.length > 0}
        <ul class="m-0 ml-5 p-0 list-none mt-1 flex flex-col gap-1">
            {#each children as child, i}
                <svelte:self {...child} activeOutlineIndex={activeOutlineIndex} />
            {/each}
        </ul>
    {/if}
</li>

<style lang="postcss">
.heading-text {
    transition: all 0.1s;
    /* padding-right: 1.5em; */
}
.is-active > .title {
    font-weight: 600;
    /* padding-right: 0; */
}
.visited > .title {
    color: #9ca3af;
}
.heading-text.is-active > .active-dot {
    display: inline-block;
    right: calc(100% + 5px);
    top: 25%;
    transition: all 0.1s;
}

</style>
