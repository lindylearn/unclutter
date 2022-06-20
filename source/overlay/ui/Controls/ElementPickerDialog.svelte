<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import ElementPickerModifier from "../../../content-script/modifications/elementPicker";
    import Icon from "../Icon.svelte";

    export let elementPickerModifier: ElementPickerModifier;
    const dispatch = createEventDispatcher();

    let elementCount: number = elementPickerModifier.pageSelectors.length;
    elementPickerModifier.pickedElementListener.push(onPickedElement);
    function onPickedElement() {
        elementCount += 1;
    }

    function reset() {
        elementCount = 0;
        elementPickerModifier.resetPage();
    }

    let showSaveMessage: boolean = false;
    async function save() {
        if (elementCount > 0) {
            showSaveMessage = true;
            await new Promise((r) => setTimeout(r, 600));
        }

        elementPickerModifier.saveSelectors();
        dispatch("save");
    }
</script>

<div class="lindy-element-picker-dialog">
    <div class="lindy-element-picker-caption">
        <a
            class="lindy-element-picker-caption-link"
            href="https://github.com/lindylearn/unclutter/tree/main/docs/element-blocking.md"
            target="_blank"
            rel="noopener noreferrer">Learn more</a
        > about element blocking
    </div>
    <div class="lindy-bugreport-buttons">
        <div class="lindy-bugreport-button" on:click={reset}>
            <Icon iconName="reset" />
            <div>Reset</div>
        </div>
        <div class="lindy-bugreport-button" on:click={save}>
            <Icon iconName="save" />
            <div>
                {#if !showSaveMessage}
                    Save <span class="lindy-counter-num">{elementCount}</span>
                    selection{elementCount !== 1 ? "s" : ""}
                {:else}
                    Thank you!
                {/if}
            </div>
        </div>
    </div>
</div>

<style global lang="postcss">
    .lindy-element-picker-dialog {
        position: absolute;
        top: 10px;
        left: 0;
        z-index: 99;
        width: calc(100% - 2 * 10px);
        padding: 10px;

        background-color: var(--background-color);
        color: var(--text-color);
        border-radius: 5px;
        filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.06))
            drop-shadow(0 1px 2px rgb(0 0 0 / 0.05)); /* custom shadow, lighter than tw 'drop-shadow' */
        cursor: auto;

        animation: easeOutBounce 0.75s;
        animation-fill-mode: both;
    }
    @keyframes easeOutBounce {
        0% {
            transform: translateY(0%);
            opacity: 0;
        }
        12% {
            transform: translateY(10.89%);
        }
        24% {
            transform: translateY(43.56%);
        }
        36% {
            transform: translateY(98.01%);
        }
        54% {
            transform: translateY(75.02%);
        }
        74% {
            transform: translateY(98.37%);
        }
        82% {
            transform: translateY(93.75%);
        }
        92% {
            transform: translateY(99.34%);
        }
        96% {
            transform: translateY(98.46%);
        }
        100% {
            opacity: 1;
            transform: translateY(100%);
        }
    }

    .lindy-element-picker-caption,
    .lindy-element-picker-caption-link {
        text-align: right;
        margin-bottom: 10px;

        color: var(--color-muted) !important;
        font-size: 11px !important;
        font-weight: 600;
        font-family: Poppins, sans-serif;
    }
    .lindy-element-picker-caption-link {
        text-decoration: underline;
    }

    .lindy-counter-num {
        display: inline-block;
        font-variant-numeric: tabular-nums;
    }
</style>
