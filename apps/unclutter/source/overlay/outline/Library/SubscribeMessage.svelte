<script lang="ts">
    import { fly, fade } from "svelte/transition";
    import { cubicOut, cubicIn } from "svelte/easing";
    import { getRandomLightColor } from "@unclutter/library-components/dist/common/styling";
    import { LibraryState } from "../../../common/schema";
    import LibraryModalModifier from "../../../content-script/modifications/libraryModal";
    import LibraryModifier from "../../../content-script/modifications/library";
    import ToggleMessage from "./ToggleMessage.svelte";
    import { getRelativeTime } from "@unclutter/library-components/dist/common";

    export let libraryState: LibraryState;
    export let libraryModifier: LibraryModifier;
    export let libraryModalModifier: LibraryModalModifier;
    export let darkModeEnabled: boolean;
</script>

<ToggleMessage
    color={getRandomLightColor(libraryState.feed?.domain, darkModeEnabled)}
    isActive={libraryState.feed?.is_subscribed}
    onToggle={() => libraryModifier.toggleFeedSubscribed()}
    onClick={() => libraryModalModifier.showModal()}
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
                {libraryState.feed.post_frequency}
            </div>
        {/if}
    </div>

    <div slot="toggle-icon">
        {#if libraryState.feed?.is_subscribed}
            <svg
                class="mx-0.5 w-5"
                viewBox="0 0 448 512"
                in:fade={{ duration: 200, easing: cubicOut }}
                ><path
                    fill="currentColor"
                    d="M440.1 103C450.3 112.4 450.3 127.6 440.1 136.1L176.1 400.1C167.6 410.3 152.4 410.3 143 400.1L7.029 264.1C-2.343 255.6-2.343 240.4 7.029 231C16.4 221.7 31.6 221.7 40.97 231L160 350.1L407 103C416.4 93.66 431.6 93.66 440.1 103V103z"
                /></svg
            >
        {:else}
            <svg
                class="mx-0.5 w-5"
                viewBox="0 0 448 512"
                in:fade={{ duration: 200, easing: cubicOut }}
                ><path
                    fill="currentColor"
                    d="M432 256C432 269.3 421.3 280 408 280h-160v160c0 13.25-10.75 24.01-24 24.01S200 453.3 200 440v-160h-160c-13.25 0-24-10.74-24-23.99C16 242.8 26.75 232 40 232h160v-160c0-13.25 10.75-23.99 24-23.99S248 58.75 248 72v160h160C421.3 232 432 242.8 432 256z"
                /></svg
            >
        {/if}
    </div>
</ToggleMessage>

<style lang="postcss">
    @media (max-width: 250px) {
        .hide-tiny {
            display: none;
        }
    }
</style>
