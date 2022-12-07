<script lang="ts">
    import { fly, fade } from "svelte/transition";
    import { cubicOut, cubicIn } from "svelte/easing";
    import twemojiSvelte from "../components/twemoji-svelte";
    import clsx from "clsx";
    import { getRandomLightColor } from "@unclutter/library-components/dist/common/styling";

    import { LibraryState } from "../../../common/schema";
    import LibraryModalModifier from "../../../content-script/modifications/libraryModal";
    import ToggleMessage from "./ToggleMessage.svelte";
    import { getActivityColor } from "@unclutter/library-components/dist/components";
    import ResourceStat from "./ResourceStat.svelte";
    import LibraryModifier from "../../../content-script/modifications/library";
    import { readingProgressFullClamp } from "@unclutter/library-components/dist/store";

    export let libraryState: LibraryState;
    export let libraryModifier: LibraryModifier;
    export let libraryModalModifier: LibraryModalModifier;
    export let darkModeEnabled: boolean;

    // local UI state
    // let topicColor: string = null;
    // $: topicColor =
    //     (libraryState.userInfo?.onPaidPlan || libraryState.userInfo?.trialEnabled) &&
    //     libraryState.libraryInfo?.topic?.id
    //         ? getRandomLightColor(libraryState.libraryInfo.topic.id, darkModeEnabled)
    //         : "";

    $: isCompleted =
        libraryState?.libraryInfo?.article &&
        libraryState.libraryInfo.article.reading_progress >= readingProgressFullClamp;
</script>

<!-- inactiveColor={getActivityColor(2, darkModeEnabled)} -->
<ToggleMessage
    activeColor={getActivityColor(3, darkModeEnabled)}
    isActive={libraryState?.libraryInfo?.article.is_queued || isCompleted}
    onToggle={() => libraryModifier.toggleArticleInQueue()}
    onClick={() => libraryModalModifier.showModal("list")}
    {darkModeEnabled}
>
    <div slot="title">
        <div class="whitespace-pre" in:fly={{ y: 10, duration: 200, easing: cubicOut }}>
            {#if libraryState?.libraryInfo?.article.is_queued}
                Saved for later
            {:else if isCompleted}
                Completed article
            {:else}
                Saved in library
            {/if}
        </div>
    </div>

    <div slot="subtitle" class="relative">
        <!-- {#if libraryState?.linkCount}
            <div class="ml-0.5" in:fly={{ y: 10, duration: 200, easing: cubicOut }}>
                <svg class="mr-0.5 inline-block w-4 align-middle" viewBox="0 0 640 512"
                    ><path
                        fill="currentColor"
                        d="M288 64C288 80.85 281.5 96.18 270.8 107.6L297.7 165.2C309.9 161.8 322.7 160 336 160C374.1 160 410.4 175.5 436.3 200.7L513.9 143.7C512.7 138.7 512 133.4 512 128C512 92.65 540.7 64 576 64C611.3 64 640 92.65 640 128C640 163.3 611.3 192 576 192C563.7 192 552.1 188.5 542.3 182.4L464.7 239.4C474.5 258.8 480 280.8 480 304C480 322.5 476.5 340.2 470.1 356.5L537.5 396.9C548.2 388.8 561.5 384 576 384C611.3 384 640 412.7 640 448C640 483.3 611.3 512 576 512C540.7 512 512 483.3 512 448C512 444.6 512.3 441.3 512.8 438.1L445.4 397.6C418.1 428.5 379.8 448 336 448C264.6 448 205.4 396.1 193.1 328H123.3C113.9 351.5 90.86 368 64 368C28.65 368 0 339.3 0 304C0 268.7 28.65 240 64 240C90.86 240 113.9 256.5 123.3 280H193.1C200.6 240.9 222.9 207.1 254.2 185.5L227.3 127.9C226.2 127.1 225.1 128 224 128C188.7 128 160 99.35 160 64C160 28.65 188.7 0 224 0C259.3 0 288 28.65 288 64V64zM336 400C389 400 432 357 432 304C432 250.1 389 208 336 208C282.1 208 240 250.1 240 304C240 357 282.1 400 336 400z"
                    /></svg
                >
                {libraryState.linkCount} + related article{libraryState.linkCount !== 1 ? "s" : ""}
            </div>
        {:else if libraryState?.libraryInfo?.article && libraryState?.readingProgress && (!(libraryState?.userInfo?.onPaidPlan || libraryState?.userInfo?.trialEnabled) || libraryState?.linkCount === 0)} -->

        {#if libraryState.readingProgress && libraryState.readingProgress.queueCount === 0}
            <div in:fly={{ y: 10, duration: 200, easing: cubicOut }}>reading queue empty</div>
        {:else if libraryState.readingProgress}
            <div in:fly={{ y: 10, duration: 200, easing: cubicOut }}>
                {libraryState.readingProgress.queueCount} article{libraryState.readingProgress
                    .queueCount === 1
                    ? ""
                    : "s"} in <span class="hide-tiny">reading </span>queue
            </div>
        {/if}
    </div>

    <div slot="toggle-icon">
        {#if isCompleted}
            <svg class="mx-0.5 w-5" viewBox="0 0 448 512"
                ><path
                    fill="currentColor"
                    d="M440.1 103C450.3 112.4 450.3 127.6 440.1 136.1L176.1 400.1C167.6 410.3 152.4 410.3 143 400.1L7.029 264.1C-2.343 255.6-2.343 240.4 7.029 231C16.4 221.7 31.6 221.7 40.97 231L160 350.1L407 103C416.4 93.66 431.6 93.66 440.1 103V103z"
                /></svg
            >
        {:else}
            <svg class="w-6" viewBox="0 0 640 512">
                <path
                    fill="currentColor"
                    d="M443.5 17.94C409.8 5.608 375.3 0 341.4 0C250.1 0 164.6 41.44 107.1 112.1c-6.752 8.349-2.752 21.07 7.375 24.68C303.1 203.8 447.4 258.3 618.4 319.1c1.75 .623 3.623 .9969 5.5 .9969c8.25 0 15.88-6.355 16-15.08C643 180.7 567.2 62.8 443.5 17.94zM177.1 108.4c42.88-36.51 97.76-58.07 154.5-60.19c-4.5 3.738-36.88 28.41-70.25 90.72L177.1 108.4zM452.6 208.1L307.4 155.4c14.25-25.17 30.63-47.23 48.13-63.8c25.38-23.93 50.13-34.02 67.51-27.66c17.5 6.355 29.75 29.78 33.75 64.42C459.6 152.4 457.9 179.6 452.6 208.1zM497.8 224.4c7.375-34.89 12.13-76.76 4.125-117.9c45.75 38.13 77.13 91.34 86.88 150.9L497.8 224.4zM576 488.1C576 501.3 565.3 512 552 512L23.99 510.4c-13.25 0-24-10.72-24-23.93c0-13.21 10.75-23.93 24-23.93l228 .6892l78.35-214.8l45.06 16.5l-72.38 198.4l248.1 .7516C565.3 464.1 576 474.9 576 488.1z"
                />
            </svg>
        {/if}
    </div>

    <!-- {#if libraryState?.readingProgress}
        <div class="absolute top-0 right-0 flex items-start gap-2 overflow-hidden p-3" in:fade>
            <ResourceStat
                type="articles"
                value={libraryState.readingProgress.articleCount -
                    libraryState.readingProgress.completedCount}
            />
            <ResourceStat type="highlights" value={libraryState.readingProgress.annotationCount} />
        </div>
    {/if} -->
</ToggleMessage>

<style lang="postcss">
    @media (max-width: 250px) {
        .hide-tiny {
            display: none;
        }
    }
</style>
