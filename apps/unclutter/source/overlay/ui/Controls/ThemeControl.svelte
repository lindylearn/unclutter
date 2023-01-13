<script lang="ts">
    import {
        saveThemeChange,
        fontSizeThemeVariable,
        getThemeValue,
        pageWidthThemeVariable,
        themeName,
    } from "../../../common/theme";
    import { reportEventContentScript } from "@unclutter/library-components/dist/common/messaging";
    import ThemeModifier from "../../../content-script/modifications/CSSOM/theme";
    import UiControlWithDialog from "./UIControlWithDialog.svelte";

    export let domain: string;
    export let themeModifier: ThemeModifier;

    const reportedEventTypes = {};
    function reportThemeEvent(changedProperty: string) {
        // Use nicer names
        if (changedProperty === fontSizeThemeVariable) {
            changedProperty = "fontSize";
        } else if (changedProperty === pageWidthThemeVariable) {
            changedProperty = "pageWidth";
        }

        if (!reportedEventTypes[changedProperty]) {
            reportEventContentScript("changeTheme", { changedProperty });
            reportedEventTypes[changedProperty] = true;
        }
    }

    function changeCssPixelVariable(varName: string, delta: number) {
        const currentSize = getThemeValue(varName).replace("px", "");
        const newSizePx = `${parseFloat(currentSize) + delta}px`;

        themeModifier.setCssThemeVariable(varName, newSizePx);
        saveThemeChange(domain, varName, newSizePx);

        reportThemeEvent(varName);
    }

    let activeColorTheme: themeName = themeModifier.activeColorTheme;
    themeModifier.activeColorThemeListeners.push((newTheme) => {
        activeColorTheme = newTheme;
    });
    function setTheme(themeName: themeName) {
        themeModifier.changeColorTheme(themeName); // also calls listener above

        reportThemeEvent("colorTheme");
    }
</script>

<UiControlWithDialog iconName="theme">
    <div class="lindy-plusminus">
        <div
            id="lindy-fontsize-decrease"
            on:click={() => changeCssPixelVariable(fontSizeThemeVariable, -1)}
        >
            <svg class="lindy-ui-icon" viewBox="0 0 448 512">
                <path
                    fill="currentColor"
                    d="M400 288h-352c-17.69 0-32-14.32-32-32.01s14.31-31.99 32-31.99h352c17.69 0 32 14.3 32 31.99S417.7 288 400 288z"
                />
            </svg>
        </div>
        <div
            id="lindy-fontsize-increase"
            on:click={() => changeCssPixelVariable(fontSizeThemeVariable, 1)}
        >
            <svg class="lindy-ui-icon" viewBox="0 0 448 512">
                <path
                    fill="currentColor"
                    d="M432 256c0 17.69-14.33 32.01-32 32.01H256v144c0 17.69-14.33 31.99-32 31.99s-32-14.3-32-31.99v-144H48c-17.67 0-32-14.32-32-32.01s14.33-31.99 32-31.99H192v-144c0-17.69 14.33-32.01 32-32.01s32 14.32 32 32.01v144h144C417.7 224 432 238.3 432 256z"
                />
            </svg>
        </div>
    </div>
    <div class="lindy-theme-ui-row-spacer" />
    <div class="lindy-plusminus">
        <div
            id="lindy-pagewidth-decrease"
            on:click={() => changeCssPixelVariable(pageWidthThemeVariable, -100)}
        >
            <svg class="lindy-ui-icon" viewBox="0 0 512 512" style="transform: rotate(45deg);">
                <path
                    fill="currentColor"
                    d="M54.63 502.6L176 381.3V432c0 17.69 14.31 32 32 32s32-14.31 32-32v-128c0-4.164-.8477-8.312-2.465-12.22C234.3 283.9 228.1 277.7 220.2 274.5C216.3 272.8 212.2 272 208 272h-128c-17.69 0-32 14.31-32 32s14.31 32 32 32h50.75l-121.4 121.4c-12.5 12.5-12.5 32.75 0 45.25S42.13 515.1 54.63 502.6zM274.5 220.2c3.242 7.84 9.479 14.08 17.32 17.32C295.7 239.2 299.8 240 304 240h128c17.69 0 32-14.31 32-32s-14.31-32-32-32h-50.75l121.4-121.4c12.5-12.5 12.5-32.75 0-45.25c-12.49-12.49-32.74-12.51-45.25 0L336 130.8V80c0-17.69-14.31-32-32-32s-32 14.31-32 32v127.1C272 212.2 272.8 216.3 274.5 220.2z"
                />
            </svg>
        </div>
        <div
            id="lindy-pagewidth-increase"
            on:click={() => changeCssPixelVariable(pageWidthThemeVariable, 100)}
        >
            <svg class="lindy-ui-icon" viewBox="0 0 512 512" style="transform: rotate(45deg);">
                <path
                    fill="currentColor"
                    d="M177.4 289.4L64 402.8V352c0-17.69-14.31-32-32-32s-32 14.31-32 32v128c0 4.164 .8477 8.312 2.465 12.22c3.24 7.832 9.479 14.07 17.31 17.31C23.69 511.2 27.84 512 32 512h128c17.69 0 32-14.31 32-32s-14.31-32-32-32H109.3l113.4-113.4c12.5-12.5 12.5-32.75 0-45.25S189.9 276.9 177.4 289.4zM509.5 19.78c-3.242-7.84-9.479-14.08-17.32-17.32C488.3 .8477 484.2 0 480 0h-128c-17.69 0-32 14.31-32 32s14.31 32 32 32h50.75l-113.4 113.4c-12.5 12.5-12.5 32.75 0 45.25c12.49 12.49 32.74 12.51 45.25 0L448 109.3V160c0 17.69 14.31 32 32 32s32-14.31 32-32V32C512 27.84 511.2 23.69 509.5 19.78z"
                />
            </svg>
        </div>
    </div>
    <div class="lindy-theme-ui-row-spacer" />
    <div class="lindy-theme-row">
        <div>
            <div
                class={"lindy-theme-button " +
                    (activeColorTheme === "auto" ? "lindy-active-theme" : "")}
                id="lindy-auto-theme-button"
                on:click={() => setTheme("auto")}
            >
                <svg viewBox="0 0 512 512">
                    <path
                        fill="currentColor"
                        d="M327.5 85.19L384 64L405.2 7.491C406.9 2.985 411.2 0 416 0C420.8 0 425.1 2.985 426.8 7.491L448 64L504.5 85.19C509 86.88 512 91.19 512 96C512 100.8 509 105.1 504.5 106.8L448 128L426.8 184.5C425.1 189 420.8 192 416 192C411.2 192 406.9 189 405.2 184.5L384 128L327.5 106.8C322.1 105.1 320 100.8 320 96C320 91.19 322.1 86.88 327.5 85.19V85.19zM257.8 187.3L371.8 240C377.5 242.6 381.1 248.3 381.1 254.6C381.1 260.8 377.5 266.5 371.8 269.1L257.8 321.8L205.1 435.8C202.5 441.5 196.8 445.1 190.6 445.1C184.3 445.1 178.6 441.5 176 435.8L123.3 321.8L9.292 269.1C3.627 266.5 0 260.8 0 254.6C0 248.3 3.627 242.6 9.292 240L123.3 187.3L176 73.29C178.6 67.63 184.3 64 190.6 64C196.8 64 202.5 67.63 205.1 73.29L257.8 187.3zM405.2 327.5C406.9 322.1 411.2 320 416 320C420.8 320 425.1 322.1 426.8 327.5L448 384L504.5 405.2C509 406.9 512 411.2 512 416C512 420.8 509 425.1 504.5 426.8L448 448L426.8 504.5C425.1 509 420.8 512 416 512C411.2 512 406.9 509 405.2 504.5L384 448L327.5 426.8C322.1 425.1 320 420.8 320 416C320 411.2 322.1 406.9 327.5 405.2L384 384L405.2 327.5z"
                    />
                </svg>
            </div>
        </div>
        <div>
            <div
                class={"lindy-theme-button " +
                    (activeColorTheme === "white" ? "lindy-active-theme" : "")}
                id="lindy-white-theme-button"
                on:click={() => setTheme("white")}
            />
        </div>
        <div>
            <div
                class={"lindy-theme-button " +
                    (activeColorTheme === "dark" ? "lindy-active-theme" : "")}
                id="lindy-dark-theme-button"
                on:click={() => setTheme("dark")}
            />
        </div>
    </div>
</UiControlWithDialog>

<style global lang="postcss">
    /* row with plus and minus buttons */
    .lindy-plusminus {
        display: flex !important;
        width: 130px !important;
    }
    .lindy-plusminus > div {
        all: revert !important;
    }
    .lindy-theme-ui-row-spacer {
        display: block !important;
        border-top: 2px solid #f3f4f6 !important;
    }

    /* individual buttons */
    .lindy-plusminus > div {
        width: 100% !important;
        height: 40px !important;

        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        cursor: pointer !important;

        font-size: 20px !important;
        font-weight: 700 !important;
    }
    .lindy-plusminus:first-child > div:first-child {
        border-top-left-radius: 5px !important;
    }
    .lindy-plusminus:first-child > div:last-child {
        border-top-right-radius: 5px !important;
    }
    .lindy-plusminus:last-child > div:first-child {
        border-bottom-left-radius: 5px !important;
    }
    .lindy-plusminus:last-child > div:last-child {
        border-bottom-right-radius: 5px !important;
    }
    .lindy-plusminus > div:hover > svg {
        color: #4b5563 !important;
    }
    .lindy-plusminus > div:hover {
        background-color: #f9fafb !important;
    }

    .lindy-theme-row {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;

        height: 40px !important;
        gap: 8px !important;
        margin: 0 8px !important;
    }
    .lindy-theme-row > div {
        flex-grow: 1 !important;
    }
    .lindy-theme-button {
        display: block !important;
        height: 20px !important;
        width: auto !important;

        border: 2.5px solid #f3f4f6 !important;
        border-radius: 5px !important;
        box-sizing: content-box !important;
        cursor: pointer !important;
    }
    .lindy-theme-button:hover {
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1) !important;
    }
    .lindy-active-theme {
        border: 2.5px solid var(--color-muted) !important;
    }
    #lindy-auto-theme-button {
        background: var(--lindy-auto-background-color) !important;
        position: relative !important;
    }
    #lindy-auto-theme-button > svg {
        position: absolute !important;
        top: 3px !important;
        left: 6px !important;

        width: 14px !important;
    }
    #lindy-white-theme-button {
        background-color: white !important;
    }
    #lindy-dark-theme-button {
        background-color: #212121 !important;
    }
</style>
