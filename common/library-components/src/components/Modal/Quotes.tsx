import React, { useContext, useEffect, useState } from "react";
import { useDebounce } from "usehooks-ts";
import { getRandomLightColor } from "../../common";
import { Annotation, AnnotationWithArticle, ReplicacheContext, useSubscribe } from "../../store";
import { Highlight } from "../Highlight";
import { SearchBox } from "./components/search";
import { FilterContext, ModalStateContext } from "./context";
import { vectorSearch } from "./Highlights";
import { ResourceStat } from "../Modal/components/numbers";

export default function QuotesTab({}: {}) {
    const { userInfo, reportEvent } = useContext(ModalStateContext);

    const rep = useContext(ReplicacheContext);
    const annotations = useSubscribe(rep, rep?.subscribe.listAnnotationsWithArticles(), null);

    const [searchedAnnotations, setSearchedAnnotations] = useState<AnnotationWithArticle[] | null>(
        null
    );
    const [query, setQuery] = useState<string>("");
    useEffect(() => {
        if (!query) {
            setSearchedAnnotations(null);
            return;
        }
    }, [query]);
    const queryDebounced = useDebounce(query, 200);
    useEffect(() => {
        if (!query || !rep || !userInfo) {
            return;
        }

        // localSparseSearch(query).then(setSearchedAnnotations);
        vectorSearch(rep, query, userInfo).then(setSearchedAnnotations);

        reportEvent("highlightsSearch");
    }, [queryDebounced]);

    const [annotationGroups, setAnnotationGroups] = useState<[string, Annotation[]][]>([]);
    useEffect(() => {
        if (annotations === null) {
            return;
        }

        let filteredAnnotations = searchedAnnotations || annotations;
        filteredAnnotations.sort((a, b) => b.created_at - a.created_at);

        const tagAnnotations: { [tag: string]: Annotation[] } = {};
        for (const annotation of filteredAnnotations) {
            if (annotation.tags === undefined) {
                annotation.tags = ["other"];
            }
            for (const tag of annotation.tags.slice(0, 1)) {
                if (tagAnnotations[tag] === undefined) {
                    tagAnnotations[tag] = [];
                }
                tagAnnotations[tag].push(annotation);
            }
        }
        const annotationGroups = Object.entries(tagAnnotations).sort(
            (a, b) => b[1][0].created_at - a[1][0].created_at
        );
        setAnnotationGroups(annotationGroups);
    }, [annotations, searchedAnnotations]);

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

            {annotationGroups.slice(0, 20).map(([tag, annotations]) => (
                <TagGroup key={tag} tag={tag} annotations={annotations} />
            ))}

            {annotations !== null && annotations.length === 0 && (
                <div className="animate-fadein col-span-3 flex w-full select-none items-center gap-2">
                    Select any article text to create a highlight.
                </div>
            )}
        </div>
    );
}

function TagGroup({ tag, annotations }: { tag: string; annotations: Annotation[] }) {
    const { darkModeEnabled, reportEvent } = useContext(ModalStateContext);
    const color = getRandomLightColor(tag, darkModeEnabled);

    return (
        <div className="tag-group relative">
            <div className="mx-0.5 mb-2 flex justify-between">
                <h2 className="title flex select-none items-center gap-2 font-medium">#{tag}</h2>

                <div className="relative px-1.5 py-0.5">
                    <ResourceStat type="highlights" value={annotations?.length} large={false} />
                </div>
            </div>

            <div
                className="relative grid grid-cols-2 gap-3 rounded-md p-3 transition-colors"
                style={{
                    background: color,
                }}
            >
                {annotations.slice(0, 4).map((annotation) => (
                    <Highlight
                        key={annotation.id}
                        annotation={annotation}
                        // @ts-ignore
                        article={annotation.article}
                        isCurrentArticle={false}
                        darkModeEnabled={darkModeEnabled}
                        reportEvent={reportEvent}
                    />
                ))}
            </div>
        </div>
    );
}
