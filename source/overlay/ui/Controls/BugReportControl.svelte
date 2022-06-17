<script lang="ts">
    import { reportPageContentScript } from "../../../common/bugReport";
    import TextContainerModifier from "../../../content-script/modifications/DOM/textContainer";
    import UiControlWithDialog from "./UIControlWithDialog.svelte";

    export let textContainerModifier: TextContainerModifier;

    let defaultOpen: boolean = false;
    let captionMessage: string = `Is there an issue with the article?`;
    if (document.body.scrollHeight < 300) {
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

        defaultOpen = true;
    }

    let reportedPage: boolean = false;
    function reportPage() {
        reportedPage = true;
        reportPageContentScript();

        // setTimeout(() => {
        //     reportedPage = false;
        // }, 3000);
    }
</script>

<UiControlWithDialog iconName="bug" {defaultOpen}>
    <div class="lindy-bugreport-content" bind:this={containerElement}>
        <div class="lindy-bugreport-caption">{captionMessage}</div>
        <button
            class={"lindy-bugreport-button " +
                (reportedPage ? "lindy-reported" : "")}
            on:click={reportPage}
        >
            {reportedPage ? "Thank you!" : "Report page"}
        </button>
    </div>
</UiControlWithDialog>

<style global lang="postcss">
    .lindy-bugreport-content {
        padding: 10px;
        width: max-content;
        display: flex;
        flex-direction: column;
        align-items: center;

        color: var(--text-color);
        font-weight: 600;
        font-family: Poppins, sans-serif;
    }

    .lindy-bugreport-caption {
        margin-bottom: 10px;

        font-size: 15px;
    }

    .lindy-bugreport-button {
        padding: 3px 6px;

        font-size: 13px;
        font-weight: 600;
        color: var(--text-color);

        cursor: pointer;
        background-color: #edd75b;
        border: none;
        border-radius: 5px;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1),
            0 1px 2px -1px rgb(0 0 0 / 0.1);
        transform: scale(100%);
        transition: box-shadow 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
            transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .lindy-bugreport-button:not(.lindy-reported):hover {
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1),
            0 2px 4px -2px rgb(0 0 0 / 0.1);
    }
    .lindy-bugreport-button.lindy-reported {
        transform: scale(97%);
        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    }
</style>
