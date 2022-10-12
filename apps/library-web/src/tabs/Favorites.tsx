import { useContext } from "react";
import {
    DraggableContext,
    DraggableArticleList,
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

            <DraggableContext articleLists={{ favorites: articles || [] }}>
                <DraggableArticleList
                    listId="favorites"
                    disableFavoriteShadow
                />
            </DraggableContext>

            <div className="mb-5" />
        </main>
    );
}
