<script lang="ts">
    import clsx from "clsx";

    import browser from "../../../common/polyfill";
    import { LibraryArticle } from "../../../common/schema";

    export let article: LibraryArticle;
    export let index: number;

    const imageUrl = `https://storage.googleapis.com/unclutter-screenshots-serverless/articles/current/${encodeURIComponent(
        article.url
        // @ts-ignore
    ).replaceAll("%", "%25")}.webp`;

    let publishYear: string = null;
    $: if (publishYear !== "2022") {
        publishYear = article.publication_date?.slice(0, 4);
    }

    const readingProgressFullClamp = 0.8;
    let readingProgress: number = null;
    $: {
        if (readingProgress > readingProgressFullClamp) {
            readingProgress = 1;
        } else {
            readingProgress = article.reading_progress;
        }
    }

    function openPage(e) {
        e.preventDefault();
        e.stopPropagation();

        browser.runtime.sendMessage(null, {
            event: "openLinkWithUnclutter",
            url: article.url,
            newTab: true,
        });
    }
</script>

<a
    class={clsx(
        "article-container relative h-52 w-44 flex-shrink-0 cursor-pointer rounded-lg bg-white transition-all shadow hover:shadow-lg overflow-hidden",
        index % 2 === 0 ? "hover:-rotate-2" : "hover:rotate-2"
    )}
    href={article.url}
    on:click={openPage}
>
    <div class="article-fallback p-3">
        <div class="select-none font-bold leading-tight">
            {article.title}
        </div>
    </div>
    <div
        class="absolute top-0 left-0 h-full w-full rounded-lg bg-cover"
        style={`background-image: url(${imageUrl});`}
    />

    <svg
        viewBox="0 0 576 512"
        class={clsx(
            "star-icon w-5 transition-all absolute bottom-3 right-1.5 text-right text-lindy drop-shadow-sm",
            !article.is_favorite && "opacity-0"
        )}
    >
        <path
            fill="currentColor"
            d="M381.2 150.3L524.9 171.5C536.8 173.2 546.8 181.6 550.6 193.1C554.4 204.7 551.3 217.3 542.7 225.9L438.5 328.1L463.1 474.7C465.1 486.7 460.2 498.9 450.2 506C440.3 513.1 427.2 514 416.5 508.3L288.1 439.8L159.8 508.3C149 514 135.9 513.1 126 506C116.1 498.9 111.1 486.7 113.2 474.7L137.8 328.1L33.58 225.9C24.97 217.3 21.91 204.7 25.69 193.1C29.46 181.6 39.43 173.2 51.42 171.5L195 150.3L259.4 17.97C264.7 6.954 275.9-.0391 288.1-.0391C300.4-.0391 311.6 6.954 316.9 17.97L381.2 150.3z"
        />
    </svg>

    {#if publishYear}
        <div
            class="publish-year absolute bottom-3 left-2 select-none rounded-lg bg-lindy px-1.5 text-sm font-medium text-stone-800"
        >
            {publishYear}
        </div>
    {/if}

    <div
        class="progress-bar absolute bottom-0 left-0 h-[7px] w-full rounded-r bg-lindy transition-all dark:bg-lindyDark"
        style={`width: ${readingProgress * 100}%`}
    />
</a>
