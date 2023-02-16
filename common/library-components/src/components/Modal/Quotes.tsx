import React, { useContext, useEffect, useState } from "react";
import { useDebounce } from "usehooks-ts";
import { getDomain, getRandomLightColor } from "../../common";
import { Annotation, AnnotationWithArticle, ReplicacheContext, useSubscribe } from "../../store";
import { Highlight } from "../Highlight";
import { SearchBox } from "./components/search";
import { FilterContext, ModalStateContext } from "./context";
import { vectorSearch } from "./Highlights";
import { ResourceStat } from "../Modal/components/numbers";
import { FilterButton } from "./Recent";
import { getActivityColor } from "../Charts";
import clsx from "clsx";

export default function QuotesTab({}: {}) {
    const { userInfo, reportEvent, darkModeEnabled } = useContext(ModalStateContext);
    const { currentArticle, domainFilter, setDomainFilter, tagFilter, setTagFilter } =
        useContext(FilterContext);

    const [activeCurrentFilter, setActiveCurrentFilter] = useState<boolean>(
        !!domainFilter && !!tagFilter
    );
    useEffect(() => {
        if (domainFilter || tagFilter) {
            setActiveCurrentFilter(true);
        }
    }, [domainFilter, tagFilter]);

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
        if (activeCurrentFilter) {
            setActiveCurrentFilter(false);
            setDomainFilter(undefined);
            setTagFilter(undefined);
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
    const [untaggedAnnotations, setUntaggedAnnotations] = useState<Annotation[]>([]);
    useEffect(() => {
        if (annotations === null) {
            return;
        }

        let filteredAnnotations =
            searchedAnnotations || annotations.filter((a) => !a.ai_created || a.tags?.length);
        filteredAnnotations.sort((a, b) => b.created_at - a.created_at);
        if (tagFilter) {
            filteredAnnotations = filteredAnnotations.filter((a) => a.tags?.includes(tagFilter));
            filteredAnnotations.forEach((a) => (a.tags = [tagFilter])); // ignore other tags
            setAnnotationGroups([[tagFilter, filteredAnnotations]]);
            return;
        }
        if (domainFilter) {
            filteredAnnotations = filteredAnnotations.filter(
                (a) => getDomain(a.article?.url) === domainFilter
            );
        }

        const tagAnnotations: { [tag: string]: Annotation[] } = {};
        const untaggedAnnotations: Annotation[] = [];
        for (const annotation of filteredAnnotations) {
            if (!annotation.tags?.length) {
                untaggedAnnotations.push(annotation);
                continue;
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
        setUntaggedAnnotations(untaggedAnnotations);
    }, [annotations, tagFilter, domainFilter, searchedAnnotations]);

    return (
        <div className="flex flex-col gap-4">
            <div className="filter-list flex justify-start gap-3">
                {activeCurrentFilter ? (
                    <FilterButton
                        title={domainFilter || `#${tagFilter}`}
                        icon={
                            <svg className="h-4" viewBox="0 0 512 512">
                                <path
                                    fill="currentColor"
                                    d="M0 73.7C0 50.67 18.67 32 41.7 32H470.3C493.3 32 512 50.67 512 73.7C512 83.3 508.7 92.6 502.6 100L336 304.5V447.7C336 465.5 321.5 480 303.7 480C296.4 480 289.3 477.5 283.6 472.1L191.1 399.6C181.6 392 176 380.5 176 368.3V304.5L9.373 100C3.311 92.6 0 83.3 0 73.7V73.7zM54.96 80L218.6 280.8C222.1 285.1 224 290.5 224 296V364.4L288 415.2V296C288 290.5 289.9 285.1 293.4 280.8L457 80H54.96z"
                                />
                            </svg>
                        }
                        onClick={() => {
                            setActiveCurrentFilter(false);
                            setDomainFilter(undefined);
                            setTagFilter(undefined);
                            reportEvent("changeListFilter", { activeCurrentFilter: null });
                        }}
                    />
                ) : (
                    <FilterButton
                        title={"Recent"}
                        icon={
                            <svg className="h-4" viewBox="0 0 512 512">
                                <path
                                    fill="currentColor"
                                    d="M0 73.7C0 50.67 18.67 32 41.7 32H470.3C493.3 32 512 50.67 512 73.7C512 83.3 508.7 92.6 502.6 100L336 304.5V447.7C336 465.5 321.5 480 303.7 480C296.4 480 289.3 477.5 283.6 472.1L191.1 399.6C181.6 392 176 380.5 176 368.3V304.5L9.373 100C3.311 92.6 0 83.3 0 73.7V73.7zM54.96 80L218.6 280.8C222.1 285.1 224 290.5 224 296V364.4L288 415.2V296C288 290.5 289.9 285.1 293.4 280.8L457 80H54.96z"
                                />
                            </svg>
                        }
                    />
                )}

                {userInfo?.aiEnabled && (
                    <SearchBox
                        query={query}
                        setQuery={setQuery}
                        placeholder={
                            annotations === null
                                ? ""
                                : `Search across your ${annotations.length} quote${
                                      annotations.length !== 1 ? "s" : ""
                                  }...`
                        }
                    />
                )}
            </div>

            {annotationGroups.slice(0, 20).map(([tag, annotations]) => (
                <TagGroup
                    key={tag}
                    tag={`#${tag}`}
                    annotations={annotations}
                    annotationLimit={tagFilter ? 100 : 4}
                    setTagFilter={setTagFilter}
                />
            ))}
            {(searchedAnnotations?.length ||
                (domainFilter && untaggedAnnotations.length) ||
                annotationGroups.length === 0) && (
                <TagGroup
                    key="untagged"
                    tag="untagged"
                    annotations={untaggedAnnotations}
                    annotationLimit={100}
                />
            )}

            {annotations !== null && annotations.length === 0 && (
                <div className="animate-fadein col-span-3 flex w-full select-none items-center gap-2">
                    Select any article text to create a highlight.
                </div>
            )}
        </div>
    );
}

function TagGroup({
    tag,
    annotations,
    annotationLimit = 4,
    setTagFilter,
}: {
    tag: string;
    annotations: Annotation[];
    annotationLimit: number;
    setTagFilter?: (tag?: string) => void;
}) {
    const { darkModeEnabled, reportEvent } = useContext(ModalStateContext);
    // const color = getRandomLightColor(tag, darkModeEnabled);

    return (
        <div className="tag-group relative">
            {tag !== "untagged" && (
                <div className="mx-0.5 mb-2 flex justify-between">
                    <h2
                        className={clsx(
                            "title flex select-none items-center gap-2 font-medium",
                            setTagFilter && "cursor-pointer transition-all hover:scale-[95%]"
                        )}
                        onClick={() => setTagFilter?.(tag.slice(1))}
                    >
                        {tag}
                    </h2>

                    {/* <div className="relative px-1.5 py-0.5">
                    <ResourceStat type="highlights" value={annotations?.length} large={false} />
                </div> */}
                </div>
            )}

            <div
                className="relative grid grid-cols-2 gap-4 rounded-md bg-stone-100 p-4 transition-colors dark:bg-neutral-800"
                style={
                    {
                        // background: color,
                        // background: getActivityColor(1, darkModeEnabled),
                    }
                }
            >
                {annotations.slice(0, annotationLimit).map((annotation) => (
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
