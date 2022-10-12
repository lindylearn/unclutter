import Head from "next/head";
import { cloneElement, useContext, useEffect, useState } from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { Link } from "wouter";
import {
    TopicTag,
    TopicEmoji,
    StaticArticleList,
} from "@unclutter/library-components/dist/components";
import {
    useSubscribe,
    Topic,
    ReplicacheContext,
} from "@unclutter/library-components/dist/store";

export default function TopicGroupTab({ group_id }) {
    const rep = useContext(ReplicacheContext);

    const [group, setGroup] = useState<Topic>();
    const [children, setChildren] = useState<Topic[]>();
    const [selectedTopic, setSelectedTopic] = useState<Topic>();
    const [lastSelectedTopicId, setLastSelectedTopicId] = useState<string>();
    useEffect(() => {
        if (rep) {
            (async () => {
                // deserialize spaces but allow -1 topics ids
                group_id = group_id[0] + group_id.slice(1).replaceAll("-", " ");

                // get state
                const group = await rep.query.getTopic(group_id);
                const children = await rep.query.getGroupTopicChildren(
                    group_id
                );

                // redirect cluster ids
                if (group_id.endsWith("_")) {
                    window.history.replaceState(null, "", getTopicUrl(group));
                    return;
                }

                // parse selected child topic from url
                let selectedTopic: Topic;
                let selectedTopicName = window.location.hash.slice(1);
                if (selectedTopicName) {
                    selectedTopic =
                        children.find(
                            (c) => topicNameToUrl(c.name) == selectedTopicName
                        ) || children[0];
                } else {
                    selectedTopic = children[0];
                }

                // set state in batch
                setGroup(group);
                setChildren(children);
                setSelectedTopic(selectedTopic);
                setLastSelectedTopicId(selectedTopic?.id);
            })();
        }
    }, [rep]);

    function selectChild(topic_id: string) {
        const selectedTopic = children?.find((c) => c.id == topic_id);
        setSelectedTopic(selectedTopic);
        window.history.replaceState(null, "", getTopicUrl(selectedTopic));
    }

    const articles = useSubscribe(
        rep,
        selectedTopic && rep?.subscribe.listTopicArticles(selectedTopic?.id),
        [],
        [selectedTopic]
    );

    return (
        <main className="min-h-full px-7 py-5">
            {group && (
                <Head>
                    <title>{selectedTopic?.name}</title>
                </Head>
            )}
            <div className="mb-5 flex items-center gap-2">
                <Link href={`/topics`}>
                    <h2 className="font-title shrink-0 cursor-pointer text-xl font-bold">
                        <TopicEmoji emoji={group?.emoji || ""} />
                        {group?.name}
                    </h2>
                </Link>

                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 256 512"
                    className="w-2"
                >
                    <path
                        fill="currentColor"
                        d="M64 448c-8.188 0-16.38-3.125-22.62-9.375c-12.5-12.5-12.5-32.75 0-45.25L178.8 256L41.38 118.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l160 160c12.5 12.5 12.5 32.75 0 45.25l-160 160C80.38 444.9 72.19 448 64 448z"
                    />
                </svg>
                <div className="flex flex-wrap gap-2">
                    {children?.map((topic) => (
                        <TopicTag
                            key={topic.id}
                            topic_id={topic.id}
                            fadedOut={topic.id !== selectedTopic?.id}
                            focused={topic.id === selectedTopic?.id}
                            onClick={() => selectChild(topic.id)}
                        />
                    ))}
                </div>

                <div className="flex-grow" />
            </div>

            <div className="relative h-full w-full">
                <TransitionGroup
                    className="h-full overflow-visible"
                    // @ts-ignore
                    childFactory={(child) => {
                        if (
                            lastSelectedTopicId &&
                            selectedTopic &&
                            lastSelectedTopicId !== selectedTopic?.id
                        ) {
                            setLastSelectedTopicId(selectedTopic.id);

                            // determine animation direction
                            let moveToLeft =
                                parseInt(lastSelectedTopicId.slice(0, -1)) >
                                parseInt(selectedTopic.id.slice(0, -1))!;

                            return cloneElement(child, {
                                classNames: moveToLeft
                                    ? "move-tab-left"
                                    : "move-tab-right",
                            });
                        }

                        return child;
                    }}
                >
                    <CSSTransition
                        timeout={500}
                        classNames="tab-page"
                        key={selectedTopic?.id}
                    >
                        <div className="">
                            <StaticArticleList
                                articles={articles}
                                // sortPosition="topic_sort_position"
                            />
                        </div>
                    </CSSTransition>
                </TransitionGroup>
            </div>
        </main>
    );
}

export function getTopicUrl(topic?: Topic | null): string | null {
    if (!topic) {
        return null;
    }

    const group_id = topic.group_id?.replaceAll(" ", "-");
    const base = `/topics/${group_id}`;
    let suffix = "";
    if (!topic.id.startsWith("-")) {
        suffix = `#${topicNameToUrl(topic.name)}`;
    }

    return `${base}${suffix}`;
}

export function topicNameToUrl(name: string) {
    return name.toLowerCase().replace(/ /g, "-");
}
