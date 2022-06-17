<script lang="ts">
    import UiControlWithDialog from "./UIControlWithDialog.svelte";

    let reportedPage: boolean = false;
    function reportPage() {
        reportedPage = true;

        setTimeout(() => {
            reportedPage = false;
        }, 3000);
    }
</script>

<UiControlWithDialog iconName="bug">
    <div class="bugreport-content">
        <div class="caption">Sorry that didn't work well.</div>
        <button
            class={"report-button " + (reportedPage ? "reported" : "")}
            on:click={reportPage}
        >
            {reportedPage ? "Thank you!" : "Report this page"}
        </button>
    </div>
</UiControlWithDialog>

<style lang="postcss">
    .bugreport-content {
        padding: 10px;
        width: max-content;
        display: flex;
        flex-direction: column;
        align-items: center;

        color: var(--text-color);
        font-weight: 600;
        font-family: Poppins, sans-serif;
    }

    .caption {
        margin-bottom: 10px;

        font-size: 15px;
    }

    .report-button {
        padding: 3px 6px;

        font-size: 15px;
        font-weight: 600;
        color: var(--text-color);

        cursor: pointer;
        background-color: #edd75b;
        border: none;
        border-radius: 5px;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1),
            0 1px 2px -1px rgb(0 0 0 / 0.1);
        transform: scale(100%);
        transition: box-shadow 0.2s ease-out, transform 0.2s ease-out;
    }
    .report-button:not(.reported):hover {
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1),
            0 2px 4px -2px rgb(0 0 0 / 0.1);
    }
    .report-button.reported {
        transform: scale(95%);
    }
</style>
