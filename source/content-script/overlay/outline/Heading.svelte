<script lang="ts">
import { scrollToElement } from "./common";

    import { OutlineItem } from "./parse";

    export let title: string;
    export let element: Element;
    export let children: OutlineItem[];
    export let currentElement: Element;

    $: isActive = currentElement === element

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

<li class="">
    <div class={"text-sm text-gray-600 font-medium cursor-pointer " + (isActive ? "font-bold" : "")} on:click={focusHeading}>{title}</div>
    {#if children.length > 0}
        <ul class="m-0 ml-5 p-0 list-none mt-1 flex flex-col gap-1">
            {#each children as child}
                <svelte:self {...child} currentElement={currentElement} />
            {/each}
        </ul>
    {/if}
</li>

