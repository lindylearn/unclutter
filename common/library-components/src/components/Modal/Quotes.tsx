import React, { useContext, useEffect, useState } from "react";
import { useDebounce } from "usehooks-ts";
import { getRandomLightColor } from "../../common";
import { AnnotationWithArticle, ReplicacheContext, useSubscribe } from "../../store";
import { Highlight } from "../Highlight";
import { SearchBox } from "./components/search";
import { FilterContext, ModalStateContext } from "./context";
import { vectorSearch } from "./Highlights";

export default function QuotesTab({}: {}) {
    const { darkModeEnabled, userInfo, reportEvent } = useContext(ModalStateContext);

    const { currentArticle, currentTopic, domainFilter, setDomainFilter, currentAnnotationsCount } =
        useContext(FilterContext);

    const rep = useContext(ReplicacheContext);
    const annotations = useSubscribe(rep, rep?.subscribe.listAnnotationsWithArticles(), null);

    const [tagCounts, setTagCounts] = useState<[string, number][]>([]);
    const [filteredAnnotations, setFilteredAnnotations] = useState<AnnotationWithArticle[]>([]);
    useEffect(() => {
        if (annotations === null) {
            return;
        }

        // filter
        let filteredAnnotations = [...annotations];
        filteredAnnotations.sort((a, b) => b.created_at - a.created_at);
        setFilteredAnnotations(filteredAnnotations);

        const tagCountsMap: { [tag: string]: number } = {};
        for (const annotation of filteredAnnotations) {
            for (const tag of annotation.tags || []) {
                if (tagCountsMap[tag] === undefined) {
                    tagCountsMap[tag] = 0;
                }
                tagCountsMap[tag] += 1;
            }
        }
        const tagCounts = Object.entries(tagCountsMap)
            .sort((a, b) => b[1] - a[1])
            .filter(([, count]) => count > 1);
        setTagCounts(tagCounts);
    }, [annotations, currentArticle, currentAnnotationsCount, currentTopic, domainFilter]);

    const [query, setQuery] = useState<string>("");

    return (
        <div className="flex flex-col gap-4">
            <SearchBox
                query={query}
                setQuery={setQuery}
                placeholder={
                    annotations === null
                        ? ""
                        : `Search across your ${annotations.length} highlight${
                              annotations.length !== 1 ? "s" : ""
                          }...`
                }
            />

            <div className="grid flex-grow auto-rows-max grid-cols-3 gap-4">
                {/* {filteredAnnotations.slice(0, 40).map((annotation) => (
                    <Highlight
                        key={annotation.id}
                        annotation={annotation}
                        article={annotation.article}
                        isCurrentArticle={currentArticle === annotation.article_id}
                        darkModeEnabled={darkModeEnabled}
                        reportEvent={reportEvent}
                    />
                ))} */}

                {tagCounts.map(([tag, count]) => (
                    <div
                        className="animate-fadein relative flex cursor-pointer select-none flex-col gap-4 overflow-hidden rounded-md bg-white p-4 text-sm text-stone-900 transition-transform hover:scale-[99%] dark:text-white"
                        style={{
                            background: getRandomLightColor(tag, darkModeEnabled),
                        }}
                    >
                        <h2 className="flex gap-2 overflow-hidden whitespace-nowrap font-medium">
                            #{tag}
                        </h2>
                        {count}
                    </div>
                ))}

                {annotations !== null && annotations.length === 0 && (
                    <div className="animate-fadein col-span-3 flex w-full select-none items-center gap-2">
                        Select any article text to create a highlight.
                    </div>
                )}
            </div>
        </div>
    );
}
