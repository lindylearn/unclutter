import { useContext } from "react";
import { useSubscribe } from "replicache-react";
import { DraggableArticleList } from "@unclutter/library-components/dist/components";
import { NoFavoritesMessage } from "../components/EmptyMessages";
import {
    listFavoriteArticles,
    ReplicacheContext,
} from "@unclutter/library-components/dist/store";

export default function FavoritesTab({}) {
    const rep = useContext(ReplicacheContext);
    const articles = useSubscribe(rep, listFavoriteArticles, null, [rep]);

    return (
        <main className="m-3">
            {articles?.length === 0 && <NoFavoritesMessage />}

            {/* <div className="flex justify-end mr-20">
                <ListFilter />
            </div> */}

            <DraggableArticleList
                articles={articles || []}
                sortPosition="favorites_sort_position"
                disableFavoriteShadow
            />

            <div className="mb-5" />
        </main>
    );
}
