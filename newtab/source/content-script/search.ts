import { SearchResult } from "@unclutter/library-components/dist/common";
import browser from "../common/polyfill";
import SearchContainerSvelte from "./SearchContainer.svelte";

let svelteComponent: SearchContainerSvelte = null;
function main() {
    // get html containers
    const searchInput: HTMLInputElement =
        document.querySelector('input[name="q"]');
    const rightColumn = getRightColumn();
    if (!searchInput || !rightColumn) {
        return;
    }

    // insert Unclutter Library UI
    const resultsContainer = document.createElement("div");
    resultsContainer.id = "unclutter-search-container";
    rightColumn.prepend(resultsContainer);
    svelteComponent = new SearchContainerSvelte({
        target: resultsContainer,
        props: {
            query: null,
            searchResults: null,
        },
    });

    // watch search query
    onQueryChange(searchInput.value);
    // searchInput.addEventListener("input", (e) =>
    //     onQueryChange(searchInput.value)
    // );
}

function getRightColumn(): HTMLDivElement | undefined {
    // existing right column
    let rightColumn = document.getElementById("rhs");
    if (rightColumn) {
        return rightColumn as HTMLDivElement;
    }

    // create new right column
    const centerColumn = document.getElementById("center_col");
    if (!centerColumn) {
        return;
    }
    rightColumn = document.createElement("div");
    rightColumn.id = "rhs";
    centerColumn.parentNode.appendChild(rightColumn);
    return rightColumn as HTMLDivElement;
}

async function onQueryChange(query: string) {
    const searchResults = await browser.runtime.sendMessage(null, {
        event: "getSearchResults",
        query,
    });

    svelteComponent.$set({ query, searchResults });
}

console.log("Injected Unclutter Library search integration");
main();
