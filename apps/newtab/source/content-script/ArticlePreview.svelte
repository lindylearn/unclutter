<script lang="ts">
    import { Article } from "@unclutter/library-components/dist/store";

    export let article: Article;

    const imageUrl = `https://storage.googleapis.com/unclutter-screenshots-serverless/articles/current/${encodeURIComponent(
        article.url
        // @ts-ignore
    ).replaceAll("%", "%25")}.webp`;
</script>

<div id="article-container" style={`background-image: url(${imageUrl});`} />

<style>
    #article-container {
        width: 70px;
        height: 85px;
        flex-shrink: 0;

        background-size: cover;
        border-radius: 6px;
        box-shadow: 0 1px 3px 0.1px rgb(0 0 0 / 20%);
    }
</style>
