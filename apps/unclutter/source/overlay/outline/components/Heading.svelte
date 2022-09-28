<script lang="ts">
    import { reportEventContentScript } from "../../../content-script/messaging";
    import { scrollToElement } from "./common";
    import { OutlineItem } from "./parse";
    import { getRandomColor } from "../../../common/annotations/styling";

    export let annotationsEnabled: boolean;
    export let socialAnnotationsEnabled: boolean;
    export let activeOutlineIndex: number;

    export let index: number;
    export let title: string;
    export let element: Element;
    export let children: OutlineItem[];
    export let myAnnotationCount: number = null;
    export let socialCommentsCount: number = null;

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
        <svg
            class="active-dot absolute hidden"
            style="width: 6px;"
            viewBox="0 0 320 512"
        >
            <path
                fill="currentColor"
                d="M320 256C320 344.4 248.4 416 160 416C71.63 416 0 344.4 0 256C0 167.6 71.63 96 160 96C248.4 96 320 167.6 320 256z"
            />
        </svg>
        <div class="title relative flex-grow overflow-hidden whitespace-nowrap">
            <div class="default-title">{title}</div>
            <div class="active-title font-title absolute top-0 left-0">
                {title}
            </div>
        </div>

        <div
            class={"px-1 rounded font-title text-center hidden " +
                (annotationsEnabled && index !== -1 ? "enabled-icon " : "") +
                (myAnnotationCount ? "visible-icon " : "")}
            style={`min-width: 1.4em; padding: 0 0.4em; background-color: ${getRandomColor(
                title
            )};`}
        >
            {myAnnotationCount}
        </div>
        <svg
            class={"w-4 mt-1 flex-shrink-0 hidden " +
                (socialAnnotationsEnabled ? "enabled-icon " : "") +
                (socialCommentsCount ? "visible-icon " : "")}
            viewBox="0 0 640 512"
        >
            <path
                fill="currentColor"
                d="M319.9 320c57.41 0 103.1-46.56 103.1-104c0-57.44-46.54-104-103.1-104c-57.41 0-103.1 46.56-103.1 104C215.9 273.4 262.5 320 319.9 320zM319.9 160c30.85 0 55.96 25.12 55.96 56S350.7 272 319.9 272S263.9 246.9 263.9 216S289 160 319.9 160zM512 160c44.18 0 80-35.82 80-80S556.2 0 512 0c-44.18 0-80 35.82-80 80S467.8 160 512 160zM369.9 352H270.1C191.6 352 128 411.7 128 485.3C128 500.1 140.7 512 156.4 512h327.2C499.3 512 512 500.1 512 485.3C512 411.7 448.4 352 369.9 352zM178.1 464c10.47-36.76 47.36-64 91.14-64H369.9c43.77 0 80.66 27.24 91.14 64H178.1zM551.9 192h-61.84c-12.8 0-24.88 3.037-35.86 8.24C454.8 205.5 455.8 210.6 455.8 216c0 33.71-12.78 64.21-33.16 88h199.7C632.1 304 640 295.6 640 285.3C640 233.8 600.6 192 551.9 192zM183.9 216c0-5.449 .9824-10.63 1.609-15.91C174.6 194.1 162.6 192 149.9 192H88.08C39.44 192 0 233.8 0 285.3C0 295.6 7.887 304 17.62 304h199.5C196.7 280.2 183.9 249.7 183.9 216zM128 160c44.18 0 80-35.82 80-80S172.2 0 128 0C83.82 0 48 35.82 48 80S83.82 160 128 160z"
            />
        </svg>
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

    /* animate font-family change with 2 text elements */
    .default-title {
        opacity: 1;
        visibility: visible;
        transition: all 0.05s;
        letter-spacing: 0px;
    }
    .active-title {
        opacity: 0;
        visibility: hidden;
        transition: all 0.05s;
    }
    .is-active .default-title {
        opacity: 0;
        visibility: hidden;
        letter-spacing: 0.2px;
    }
    .is-active .active-title {
        opacity: 1;
        visibility: visible;
    }

    /* if feature enabled, reserve space in each row */
    .enabled-icon {
        display: block;
        visibility: hidden;
    }
    /* if visible for this row, animate opacity */
    .visible-icon {
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
