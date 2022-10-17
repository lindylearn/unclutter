import { useContext } from "react";
import {
    DraggableContext,
    DraggableArticleList,
    StaticArticleList,
} from "@unclutter/library-components/dist/components";
import { NoFavoritesMessage } from "../components/EmptyMessages";
import {
    useSubscribe,
    ReplicacheContext,
} from "@unclutter/library-components/dist/store";

export default function FavoritesTab({}) {
    const rep = useContext(ReplicacheContext);
    const articles = useSubscribe(
        rep,
        rep?.subscribe.listFavoriteArticles(),
        null
    );

    return (
        <main className="m-3">
            {articles?.length === 0 && <NoFavoritesMessage />}

            <StaticArticleList articles={articles} disableFavoriteShadow />

            <div className="mb-5" />
        </main>
    );
}
