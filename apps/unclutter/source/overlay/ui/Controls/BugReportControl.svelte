<script lang="ts">
    import { reportPageContentScript } from "../../../common/bugReport";
    import { incrementPageReportCount } from "../../../common/storage";
    import { reportEventContentScript } from "../@unclutter/library-components/dist/common";
    import TextContainerModifier from "../../../content-script/modifications/DOM/textContainer";
    import ElementPickerModifier from "../../../content-script/modifications/elementPicker";
    import Icon from "../Icon.svelte";
    import ElementPickerModifierDialog from "./ElementPickerDialog.svelte";
    import UiControlWithDialog from "./UIControlWithDialog.svelte";

    export let elementPickerModifier: ElementPickerModifier;
    // export let textContainerModifier: TextContainerModifier;

    let defaultOpen: boolean = false;
    let supportElementBlocker: boolean = true;
    let activeElementBlocker: boolean = false;
    let captionMessage: string = `Is there an issue with this article?`;
    if (document.body.scrollHeight < 500) {
        captionMessage = `Sorry this article doesn't work.`;
        setDefaultOpen();
    }

    let containerElement: HTMLDivElement;
    async function setDefaultOpen() {
        await new Promise((r) => setTimeout(r, 600));

        function onInteraction() {
            // close popup on user action
            defaultOpen = false;

            window.removeEventListener("click", onInteraction);
            window.removeEventListener("blur", onInteraction);
            containerElement.removeEventListener("mouseenter", onInteraction); // popup will still be shown through hover style
        }
        window.addEventListener("click", onInteraction);
        window.addEventListener("blur", onInteraction); // iframe click
        containerElement.addEventListener("mouseenter", onInteraction);

        supportElementBlocker = false;
        defaultOpen = true;
    }

    let reportedPage: boolean = false;
    function reportPage() {
        if (!reportedPage) {
            reportedPage = true;
            reportPageContentScript();
        }
    }

    function toggleElementBlocker() {
        activeElementBlocker = !activeElementBlocker;
        if (activeElementBlocker) {
            elementPickerModifier.enable();

            function onKeyPress(event: KeyboardEvent) {
                if (["Esc", "Escape"].includes(event.key)) {
                    document.removeEventListener("keydown", onKeyPress);

                    elementPickerModifier.resetPage();
                    toggleElementBlocker();
                }
            }
            document.addEventListener("keydown", onKeyPress);
            reportEventContentScript("enableElementBlocker");
        } else {
            elementPickerModifier.disable();
        }
    }
</script>

<UiControlWithDialog
    iconName="bug"
    defaultOpen={defaultOpen || activeElementBlocker}
>
    <div class="lindy-bugreport-content" bind:this={containerElement}>
        <div class="lindy-bugreport-caption">{captionMessage}</div>
        <div class="lindy-bugreport-buttons">
            {#if supportElementBlocker}
                <div
                    class={"lindy-bugreport-button lindy-bugreport-block " +
                        (activeElementBlocker ? "lindy-pressed" : "")}
                    on:click={toggleElementBlocker}
                >
                    <Icon iconName="selector" />
                    <div>Block elements</div>
                </div>
            {/if}

            <div
                class={"lindy-bugreport-button lindy-bugreport-flag " +
                    (reportedPage ? "lindy-pressed" : "")}
                on:click={reportPage}
            >
                <Icon iconName="flag" />
                <div style="position: relative;">
                    <span style={reportedPage ? "visibility: hidden;" : ""}
                        >Report page</span
                    >
                    <div
                        style={"position: absolute; top: 0; left: 0;" +
                            (reportedPage ? "" : "display: none;")}
                    >
                        Thank you!
                    </div>
                </div>
            </div>
        </div>
    </div>
    {#if activeElementBlocker}
        <ElementPickerModifierDialog
            {elementPickerModifier}
            on:save={toggleElementBlocker}
        />
    {/if}
</UiControlWithDialog>

<style global lang="postcss">
    .lindy-bugreport-content {
        position: relative;
        padding: 10px;
        width: max-content;
        z-index: 3001;

        color: var(--text-color);
        font-family: Poppins, sans-serif;
    }

    .lindy-bugreport-caption {
        margin-bottom: 10px;

        font-size: 14px;
        font-weight: 600;
    }

    .lindy-bugreport-buttons {
        display: flex;
        justify-content: end;
        gap: 10px;
    }
    .lindy-bugreport-button {
        padding: 2px 8px;
        display: flex;
        align-items: center;

        font-size: 13px;
        font-weight: 600;
        color: var(--text-color);

        cursor: pointer;
        border: none;
        border-radius: 5px;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1),
            0 1px 2px -1px rgb(0 0 0 / 0.1);
        background-color: #f3f4f6;
        user-select: none;

        transform: scale(100%);
        filter: brightness(100%);
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .lindy-bugreport-button > .lindy-ui-icon {
        color: var(--text-color) !important;
        width: 1em !important;
        margin-right: 3px;
    }

    .lindy-bugreport-button:not(.lindy-pressed):hover {
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1),
            0 2px 4px -2px rgb(0 0 0 / 0.1);
        filter: brightness(95%);
    }
    .lindy-bugreport-button.lindy-pressed {
        transform: scale(95%);
        box-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
    }

    .lindy-bugreport-flag {
        background-color: #edd75b;
    }
    .lindy-bugreport-flag.lindy-pressed {
        cursor: default;
    }
</style>
