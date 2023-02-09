<script lang="ts">
    import { reportEventContentScript } from "@unclutter/library-components/dist/common/messaging";
    import { scrollToElement } from "./common";
    import { OutlineItem } from "./parse";
    import { getRandomColor } from "../../../common/annotations/styling";
    import clsx from "clsx";

    export let annotationsEnabled: boolean;
    export let totalAnnotationCount: number;
    export let socialAnnotationsEnabled: boolean;
    export let activeOutlineIndex: number;

    export let index: number;
    export let title: string;
    export let element: Element;
    export let children: OutlineItem[];
    export let myAnnotationCount: number = null;
    export let socialCommentsCount: number = null;
    export let relatedCount: number = null;

    let activateStateClass = "";
    $: if (
        children.length !== 0 &&
        activeOutlineIndex > index &&
        activeOutlineIndex <= children[children.length - 1].index
    ) {
        // active parent
        // not completely correctly, e.g. on https://blog.adamchalmers.com/making-a-dns-client/
        activateStateClass = "visited";
    } else if (index === activeOutlineIndex) {
        // active
        activateStateClass = "is-active";
    } else if (index < activeOutlineIndex) {
        // visited
        activateStateClass = "visited";
    } else if (index > activeOutlineIndex) {
        activateStateClass = "";
    }

    function focusHeading() {
        // TODO can remove this here?
        // if (!element.id) {
        //     // create id for linking
        //     element.id = title.toLowerCase().split(" ").slice(0, 5).join("-")

        //     // TODO strip non-alphanumeric
        // }
        // history.replaceState(null, null, `#${element.id}`);

        scrollToElement(element);

        reportEventContentScript("clickOutlineHeading");
    }
</script>

<li class="heading">
    <div
        class={"heading-text relative text-sm cursor-pointer flex w-full gap-2 items-start transition-all " +
            activateStateClass}
        on:click={focusHeading}
    >
        <!-- <svg class="active-dot absolute hidden" style="width: 6px;" viewBox="0 0 320 512">
            <path
                fill="currentColor"
                d="M320 256C320 344.4 248.4 416 160 416C71.63 416 0 344.4 0 256C0 167.6 71.63 96 160 96C248.4 96 320 167.6 320 256z"
            />
        </svg> -->
        <div class="title relative flex-grow overflow-hidden overflow-ellipsis whitespace-nowrap">
            {title}
        </div>

        <svg
            class={clsx(
                "hidden w-4 mt-1 flex-shrink-0 mr-0.5",
                socialCommentsCount && "visible-icon"
            )}
            viewBox="0 0 640 512"
        >
            <path
                fill="currentColor"
                d="M319.9 320c57.41 0 103.1-46.56 103.1-104c0-57.44-46.54-104-103.1-104c-57.41 0-103.1 46.56-103.1 104C215.9 273.4 262.5 320 319.9 320zM319.9 160c30.85 0 55.96 25.12 55.96 56S350.7 272 319.9 272S263.9 246.9 263.9 216S289 160 319.9 160zM512 160c44.18 0 80-35.82 80-80S556.2 0 512 0c-44.18 0-80 35.82-80 80S467.8 160 512 160zM369.9 352H270.1C191.6 352 128 411.7 128 485.3C128 500.1 140.7 512 156.4 512h327.2C499.3 512 512 500.1 512 485.3C512 411.7 448.4 352 369.9 352zM178.1 464c10.47-36.76 47.36-64 91.14-64H369.9c43.77 0 80.66 27.24 91.14 64H178.1zM551.9 192h-61.84c-12.8 0-24.88 3.037-35.86 8.24C454.8 205.5 455.8 210.6 455.8 216c0 33.71-12.78 64.21-33.16 88h199.7C632.1 304 640 295.6 640 285.3C640 233.8 600.6 192 551.9 192zM183.9 216c0-5.449 .9824-10.63 1.609-15.91C174.6 194.1 162.6 192 149.9 192H88.08C39.44 192 0 233.8 0 285.3C0 295.6 7.887 304 17.62 304h199.5C196.7 280.2 183.9 249.7 183.9 216zM128 160c44.18 0 80-35.82 80-80S172.2 0 128 0C83.82 0 48 35.82 48 80S83.82 160 128 160z"
            />
        </svg>
        <!-- <svg
            class={clsx("hidden w-4 mt-1 flex-shrink-0 mr-0.5", relatedCount && "visible-icon")}
            viewBox="0 0 512 512"
        >
            <path
                fill="currentColor"
                d="M425 182c-3.027 0-6.031 .1758-9 .5195V170C416 126.4 372.8 96 333.1 96h-4.519c.3457-2.969 .5193-5.973 .5193-9c0-48.79-43.92-87-100-87c-56.07 0-100 38.21-100 87c0 3.027 .1761 6.031 .5218 9h-56.52C33.2 96 0 129.2 0 170v66.21C0 253.8 6.77 269.9 17.85 282C6.77 294.1 0 310.2 0 327.8V438C0 478.8 33.2 512 73.1 512h110.2c17.63 0 33.72-6.77 45.79-17.85C242.1 505.2 258.2 512 275.8 512h58.21C372.8 512 416 481.6 416 438v-56.52c2.969 .3438 5.973 .5195 9 .5195C473.8 382 512 338.1 512 282S473.8 182 425 182zM425 334c-26.35 0-25.77-26-45.21-26C368.9 308 368 316.9 368 327.8V438c0 14.36-19.64 26-34 26h-58.21C264.9 464 256 455.1 256 444.2c0-19.25 25.1-18.88 25.1-45.21c0-21.54-23.28-39-52-39c-28.72 0-52 17.46-52 39c0 26.35 26 25.77 26 45.21C204 455.1 195.1 464 184.2 464H73.1C59.64 464 48 452.4 48 438v-110.2C48 316.9 56.86 308 67.79 308c19.25 0 18.88 26 45.21 26c21.54 0 39-23.28 39-52s-17.46-52-39-52C86.65 230 87.23 256 67.79 256C56.86 256 48 247.1 48 236.2V170C48 155.6 59.64 144 73.1 144h110.2C195.1 144 204 143.1 204 132.2c0-19.25-26-18.88-26-45.21c0-21.54 23.28-39 52-39c28.72 0 52 17.46 52 39C281.1 113.4 256 112.8 256 132.2C256 143.1 264.9 144 275.8 144h58.21C348.4 144 368 155.6 368 170v66.21C368 247.1 368.9 256 379.8 256c19.25 0 18.88-26 45.21-26c21.54 0 39 23.28 39 52S446.5 334 425 334z"
            />
        </svg> -->
        <!-- <div
            class={clsx(
                "hidden px-1 rounded font-title text-center",
                annotationsEnabled &&
                    totalAnnotationCount &&
                    socialCommentsCount &&
                    index !== -1 &&
                    "icon-padding",
                myAnnotationCount && "visible-icon"
            )}
            style={`min-width: 1.4em; padding: 0 0.4em; background-color: ${getRandomColor(
                title
            )};`}
        >
            {myAnnotationCount}
        </div> -->
    </div>
    {#if children.length > 0}
        <ul class="m-0 ml-5 mt-1 flex list-none flex-col gap-1 p-0">
            {#each children as child, i}
                <svelte:self
                    {activeOutlineIndex}
                    {annotationsEnabled}
                    {socialAnnotationsEnabled}
                    {...child}
                />
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
        /* font-weight: 600; */
        /* padding-right: 0; */
    }
    .visited > .title {
        color: #a8a29e;
    }
    .heading-text.is-active > .active-dot {
        display: inline-block;
        right: calc(100% + 5px);
        top: 25%;
        transition: all 0.1s;
    }

    /* reserve space in each row so private & public annotations look nice together */
    .icon-padding {
        display: block;
        visibility: hidden;
    }
    /* if visible for this row, animate opacity */
    .visible-icon {
        display: block;
        visibility: visible !important;

        animation-duration: 0.3s;
        animation-name: fadeInFromNone;
        animation-fill-mode: forwards;
    }
    @keyframes fadeInFromNone {
        0% {
            opacity: 0;
        }
        1% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }
</style>
