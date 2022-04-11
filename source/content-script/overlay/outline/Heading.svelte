<script lang="ts">
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
        activateStateClass = "text-gray-400"
    } else if (index === activeOutlineIndex) {
        // active
        activateStateClass = "is-active font-bold"
    } else if (index < activeOutlineIndex) {
        // visited
        activateStateClass = "text-gray-400"
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
    }
</script>

<li class="text-gray-600">
    <div class={"heading-text w-fit relative text-sm cursor-pointer " + activateStateClass} on:click={focusHeading}>
        <!-- {#if index === -1}
            
        {/if} -->
        <svg class="active-dot hidden w-1.5" viewBox="0 0 320 512">
            <path fill="currentColor" d="M320 256C320 344.4 248.4 416 160 416C71.63 416 0 344.4 0 256C0 167.6 71.63 96 160 96C248.4 96 320 167.6 320 256z"/>
        </svg>
        {title}
    </div>
    {#if children.length > 0}
        <ul class="m-0 ml-5 p-0 list-none mt-1 flex flex-col gap-1">
            {#each children as child, i}
                <svelte:self {...child} activeOutlineIndex={activeOutlineIndex} />
            {/each}
        </ul>
    {/if}
</li>

<style>
.heading-text {
    /* some padding for font weight change */
    padding-right: 1em;

    transition: all 0.1s;
}
.heading-text.is-active > .active-dot {
    display: inline-block;
    position: absolute;
    right: calc(100% + 4px);
    top: 25%;
    transition: all 0.1s;
}

</style>
