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
        activateStateClass = ""
    } else if (index === activeOutlineIndex) {
        // active
        activateStateClass = "font-bold"
    } else if (index < activeOutlineIndex) {
        // visited
        activateStateClass = "text-gray-400"
    } else if (index > activeOutlineIndex) {
        activateStateClass = ""
    }

    function focusHeading() {
        // TODO can remove this here?
        if (!element.id) {
            // create id for linking
            element.id = title.replace(/ /g, "-").toLowerCase()

            // TODO strip non-alphanumeric
        }

        history.replaceState(null, null, `#${element.id}`);

        scrollToElement(element)
    }
</script>

<li class="text-gray-600 font-medium">
    <div class={"text-sm cursor-pointer " + activateStateClass} on:click={focusHeading}>{title}</div>
    {#if children.length > 0}
        <ul class="m-0 ml-5 p-0 list-none mt-1 flex flex-col gap-1">
            {#each children as child, i}
                <svelte:self {...child} activeOutlineIndex={activeOutlineIndex} />
            {/each}
        </ul>
    {/if}
</li>

