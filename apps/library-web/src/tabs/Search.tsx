import { useUser } from "@supabase/auth-helpers-react";
import clsx from "clsx";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useDebounce } from "usehooks-ts";
import { wrap as wrapWorker, Remote } from "comlink";

import { SearchIndex, SearchResult } from "@unclutter/library-components/dist/common";
import {
    ArticlePreview,
    TopicGroupBackground,
} from "@unclutter/library-components/dist/components";
import { getArticle, ReplicacheContext } from "@unclutter/library-components/dist/store";
import { SearchWorkerContent } from "../../pages/[...app]";

export default function SearchTab({ searchQuery }) {
    const { user } = useUser();
    const rep = useContext(ReplicacheContext);

    const workerPort = useContext(SearchWorkerContent);

    // ref to access lastest query in search() closure
    const latestSearchQuery = useRef();
    latestSearchQuery.current = searchQuery;
    // debounce search
    const searchQueryDebounced = useDebounce(searchQuery, 100);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [hitsPerTopic, setHitsPerTopic] = useState<[string, SearchResult[]][]>();
    async function search(query: string) {
        if (!user || !query || !workerPort) {
            setIsLoading(false);
            setError(null);
            setHitsPerTopic(undefined);
            return;
        }

        setIsLoading(true);
        try {
            const searchIndex = wrapWorker<SearchIndex>(workerPort);

            const hits = await searchIndex.search(query);
            let hitsWithArticles = await Promise.all(
                hits.map(async (hit) => ({
                    ...hit,
                    article: await rep?.query.getArticle(hit.id),
                }))
            );
            hitsWithArticles = hitsWithArticles.filter((hit) => hit.article !== undefined);

            const groupsMap: { [topic_id: string]: SearchResult[] } = hitsWithArticles.reduce(
                (acc, hit) => {
                    const topic_id = hit.article?.topic_id!;
                    if (!acc[topic_id]) {
                        acc[topic_id] = [];
                    }
                    acc[topic_id].push(hit);
                    return acc;
                },
                {}
            );
            const groups = Object.entries(groupsMap);

            if (query !== latestSearchQuery.current) {
                // user already updated the search query
                return;
            }

            setIsLoading(false);
            setError(null);
            setHitsPerTopic(groups);
        } catch (err) {
            const serverError: string = await err.response?.text();
            if (serverError && !serverError.startsWith("Exception at")) {
                setError(serverError.replaceAll('"', ""));
            } else {
                setError("Error fetching results");
            }
            setIsLoading(false);
            setHitsPerTopic(undefined);
        }
    }
    useEffect(() => {
        search(searchQuery);
    }, [searchQueryDebounced]);

    return (
        <div className="m-5">
            {!searchQuery && !hitsPerTopic && !error && (
                <div>To search, enter a query in the input above.</div>
            )}
            {error && <div>{error}</div>}
            {hitsPerTopic?.length === 0 && <div>No results found</div>}

            <div className="flex flex-wrap gap-3">
                {hitsPerTopic?.map(([topic_id, hits]) => (
                    <TopicGroupBackground
                        topic_id={topic_id}
                        className={clsx("max-w-max", hits.length > 1 && "col-span-2")}
                    >
                        <div className={clsx("grid gap-10 ", hits.length > 1 && "grid-cols-2")}>
                            {hits.map((hit, index) => (
                                <div className="animate-fadein flex h-56 gap-3">
                                    {/* <div className="origin-top-left scale-75 hover:scale-100 transition-transform w-36"> */}
                                    <ArticlePreview
                                        key={hit.article!.id}
                                        listState={"static"}
                                        article={hit.article!}
                                        listIndex={index}
                                        className="shrink-0"
                                    />
                                    {/* </div> */}
                                    <div
                                        className="h-max max-w-md overflow-y-hidden text-ellipsis p-1"
                                        style={{
                                            display: "-webkit-box",
                                            WebkitBoxOrient: "vertical",
                                            WebkitLineClamp: 8,
                                            // background: getRandomColor(
                                            //     topic_id
                                            // ).replace("0.4)", "0.15)"),
                                        }}
                                    >
                                        {/* {`${hit.score}`.slice(0, 8)}{" "} */}
                                        {hit.sentences.map((sentence, sentenceIndex) => (
                                            <span
                                                className={clsx(
                                                    "",
                                                    sentenceIndex === hit.main_sentence
                                                        ? "font-bold dark:text-stone-200"
                                                        : "opacity-90"
                                                )}
                                            >
                                                {sentence}{" "}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TopicGroupBackground>
                ))}
            </div>
        </div>
    );
}
