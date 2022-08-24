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
        "relative h-52 w-44 flex-shrink-0 cursor-pointer rounded-lg bg-white transition-all dark:brightness-90 shadow hover:shadow-lg",
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
</a>
