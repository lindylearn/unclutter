<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { submitElementBlocklistContentScript } from "../../../common/bugReport";
    import ElementPickerModifier from "../../../content-script/modifications/elementPicker";
    import Icon from "../Icon.svelte";

    export let elementPickerModifier: ElementPickerModifier;
    const dispatch = createEventDispatcher();

    let elementCount: number = elementPickerModifier.pageSelectors.length;
    elementPickerModifier.pickedElementListener.push(onPickedElement);
    function onPickedElement() {
        elementCount += 1;
    }

    let isResetDelay = false;
    async function reset() {
        elementCount = 0;
        elementPickerModifier.resetPage();
        isResetDelay = true;

        await new Promise((r) => setTimeout(r, 200));
        isResetDelay = false;
    }

    let showSaveMessage: boolean = false;
    async function save() {
        // always save, can also be used to remove selectors
        elementPickerModifier.saveSelectors();

        if (elementCount > 0) {
            showSaveMessage = true;

            // submit to github, but keep local state
            submitElementBlocklistContentScript(
                elementPickerModifier.pageSelectors
            );
            await new Promise((r) => setTimeout(r, 600));
        }

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
        <div
            class={"lindy-bugreport-button " +
                (isResetDelay ? "lindy-pressed" : "")}
            on:click={reset}
        >
            <Icon iconName="reset" />
            <div>Reset</div>
        </div>
        <div
            class={"lindy-bugreport-button " +
                (showSaveMessage ? "lindy-pressed" : "")}
            on:click={save}
        >
            <Icon iconName="save" />
            <div style="position: relative;">
                <span style={showSaveMessage ? "visibility: hidden;" : ""}
                    >Save <span class="lindy-counter-num">{elementCount}</span>
                    selector<span
                        style={elementCount !== 1 ? "" : "visibility: hidden;"}
                        >s</span
                    ></span
                >
                <div
                    style={"position: absolute; top: 0; left: 0;" +
                        (showSaveMessage ? "" : "display: none;")}
                >
                    Thank you!
                </div>
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
        width: 100%;
        box-sizing: border-box;
        padding: 10px;

        background-color: var(--background-color);
        color: var(--text-color);
        font-weight: 600;
        font-family: Poppins, sans-serif;

        border-radius: 5px;
        /* shadow already set in parent */
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
    }
    .lindy-element-picker-caption-link {
        text-decoration: underline;
    }

    .lindy-counter-num {
        display: inline-block;
        min-width: 0.5em;
    }
</style>
