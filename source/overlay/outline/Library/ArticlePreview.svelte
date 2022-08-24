<script lang="ts">
    import clsx from "clsx";

    import { LibraryArticle } from "../../../common/schema";

    export let article: LibraryArticle;
    export let index: number;

    const imageUrl = `https://storage.googleapis.com/unclutter-screenshots-serverless/articles/current/${encodeURIComponent(
        article.url
        // @ts-ignore
    ).replaceAll("%", "%25")}.webp`;
    console.log(imageUrl);
</script>

<div
    class={clsx(
        "relative h-36 w-28 flex-shrink-0 cursor-pointer rounded-lg bg-white transition-all hover:rotate-2 dark:brightness-90",
        index % 2 === 0 ? "-rotate-1" : "rotate-1"
    )}
>
    <div
        class="absolute top-0 left-0 h-full w-full rounded-lg bg-cover"
        style={`background-image: url(${imageUrl});`}
    />
</div>
