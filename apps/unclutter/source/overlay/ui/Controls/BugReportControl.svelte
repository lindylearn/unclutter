<script lang="ts">
    import { reportPageContentScript } from "../../../common/bugReport";
    import { incrementPageReportCount } from "../../../common/storage";
    import { reportEventContentScript } from "@unclutter/library-components/dist/common";
    import TextContainerModifier from "../../../content-script/modifications/DOM/textContainer";
    import ElementPickerModifier from "../../../content-script/modifications/elementPicker";
    import Icon from "../Icon.svelte";
    import ElementPickerModifierDialog from "./ElementPickerDialog.svelte";
    import UiControlWithDialog from "./UIControlWithDialog.svelte";

    export let domain: string;
    export let elementPickerModifier: ElementPickerModifier;
    // export let textContainerModifier: TextContainerModifier;

    let defaultOpen: boolean = false;
    let activeElementBlocker: boolean = false;
    let captionMessage: string = `Is there an issue with this article?`;
    if (
        elementPickerModifier.readingTimeModifier.likelyMainTextMissing &&
        !domain.includes("lindylearn.io")
    ) {
        captionMessage = `Sorry if this article doesn't work well.`;
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

<UiControlWithDialog iconName="bug" defaultOpen={defaultOpen || activeElementBlocker}>
    <div class="lindy-bugreport-content" bind:this={containerElement}>
        <div class="lindy-bugreport-caption">{captionMessage}</div>
        <div class="lindy-bugreport-buttons">
            <div
                class={"lindy-bugreport-button lindy-bugreport-block " +
                    (activeElementBlocker ? "lindy-pressed" : "")}
                on:click={toggleElementBlocker}
            >
                <Icon iconName="selector" />
                <div>Block elements</div>
            </div>

            <div
                class={"lindy-bugreport-button lindy-bugreport-flag " +
                    (reportedPage ? "lindy-pressed" : "")}
                on:click={reportPage}
            >
                <Icon iconName="flag" />
                <div style="position: relative;">
                    <span style={reportedPage ? "visibility: hidden;" : ""}>Report page</span>
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
        <ElementPickerModifierDialog {elementPickerModifier} on:save={toggleElementBlocker} />
    {/if}
</UiControlWithDialog>

<style global lang="postcss">
    .lindy-bugreport-content {
        position: relative !important;
        padding: 10px !important;
        width: max-content !important;
        z-index: 3001 !important;

        color: var(--text-color) !important;
        font-family: Poppins, sans-serif !important;
    }

    .lindy-bugreport-caption {
        margin-bottom: 10px !important;

        font-size: 14px !important;
        font-weight: 600 !important;
    }

    .lindy-bugreport-buttons {
        display: flex !important;
        justify-content: end !important;
        gap: 10px !important;
    }
    .lindy-bugreport-button {
        padding: 2px 8px !important;
        display: flex !important;
        align-items: center !important;
        width: auto !important;

        font-size: 13px !important;
        font-weight: 600 !important;
        color: var(--text-color) !important;

        cursor: pointer !important;
        border: none !important;
        border-radius: 5px !important;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1) !important;
        background-color: #f3f4f6 !important;
        user-select: none !important;

        transform: scale(100%) !important;
        filter: brightness(100%) !important;
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
    }
    .lindy-bugreport-button > .lindy-ui-icon {
        color: var(--text-color) !important;
        width: 1em !important;
        margin-right: 3px !important;
    }

    .lindy-bugreport-button:not(.lindy-pressed):hover {
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
        filter: brightness(95%) !important;
    }
    .lindy-bugreport-button.lindy-pressed {
        transform: scale(95%) !important;
        box-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.05) !important;
    }

    .lindy-bugreport-flag {
        background-color: #edd75b !important;
    }
    .lindy-bugreport-flag.lindy-pressed {
        cursor: default !important;
    }
</style>
