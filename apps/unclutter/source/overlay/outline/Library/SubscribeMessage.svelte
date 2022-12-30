<script lang="ts">
    import { fly, fade } from "svelte/transition";
    import { cubicOut, cubicIn } from "svelte/easing";
    import { LibraryState } from "../../../common/schema";
    import LibraryModalModifier from "../../../content-script/modifications/libraryModal";
    import LibraryModifier from "../../../content-script/modifications/library";
    import ToggleMessage from "./ToggleMessage.svelte";
    import { getRandomLightColor } from "@unclutter/library-components/dist/common/styling";
    import { formatPostFrequency } from "@unclutter/library-components/dist/common/util";
    import { getRelativeTime } from "@unclutter/library-components/dist/common/time";

    export let libraryState: LibraryState;
    export let libraryModifier: LibraryModifier;
    export let libraryModalModifier: LibraryModalModifier;
    export let darkModeEnabled: boolean;
</script>

<!-- inactiveColor={getRandomLightColor(libraryState.feed?.domain, darkModeEnabled)
    .replace("0.6", "0.3")
    .replace("1.0", "0.5")} -->
<ToggleMessage
    activeColor={getRandomLightColor(libraryState.feed?.domain, darkModeEnabled)}
    isActive={libraryState.feed?.is_subscribed}
    onToggle={() => libraryModifier.toggleFeedSubscribed()}
    onClick={() => libraryModalModifier.showModal("feeds")}
    {darkModeEnabled}
>
    <div slot="title">
        {#if libraryState.feed}
            <!-- <span class="hide-tiny">{libraryState.feed.is_subscribed ? "Following" : "Follow"}</span> -->
            {libraryState.feed.title || libraryState.feed.domain}
        {/if}
    </div>

    <div slot="subtitle">
        {#if libraryState.feed?.is_subscribed && libraryState.feed?.time_added}
            <div class="" in:fly={{ y: 10, duration: 200, easing: cubicOut }}>
                following since {getRelativeTime(libraryState.feed.time_added * 1000)}
            </div>
        {:else if libraryState.feed?.post_frequency}
            <div class="" in:fly={{ y: 10, duration: 200, easing: cubicOut }}>
                <!-- <span class="hide-tiny">about </span> -->
                {formatPostFrequency(libraryState.feed.post_frequency)}
            </div>
        {/if}
    </div>

    <div slot="toggle-icon">
        <svg class="mx-0.5 w-5" viewBox="0 0 512 512"
            ><path
                fill="currentColor"
                d="M464 320h-96c-9.094 0-17.41 5.125-21.47 13.28L321.2 384H190.8l-25.38-50.72C161.4 325.1 153.1 320 144 320H32c-17.67 0-32 14.33-32 32v96c0 35.35 28.65 64 64 64h384c35.35 0 64-28.65 64-64v-80C512 341.5 490.5 320 464 320zM464 448c0 8.822-7.178 16-16 16H64c-8.822 0-16-7.178-16-16v-80h81.16l25.38 50.72C158.6 426.9 166.9 432 176 432h160c9.094 0 17.41-5.125 21.47-13.28L382.8 368H464V448zM238.4 312.3C242.1 317.2 249.3 320 256 320s13.03-2.781 17.59-7.656l104-112c9-9.719 8.438-24.91-1.25-33.94c-9.719-8.969-24.88-8.438-33.94 1.25L280 234.9V24c0-13.25-10.75-24-24-24S232 10.75 232 24v210.9L169.6 167.7C160.5 157.1 145.4 157.4 135.7 166.4C125.1 175.4 125.4 190.6 134.4 200.3L238.4 312.3z"
            /></svg
        >
    </div>
</ToggleMessage>

<style lang="postcss">
    @media (max-width: 250px) {
        .hide-tiny {
            display: none;
        }
    }
</style>
