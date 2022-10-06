import clsx from "clsx";
import { useContext } from "react";
import { NoTopicsMessage } from "../components/EmptyMessages";
import {
    TopicTag,
    TopicEmoji,
} from "@unclutter/library-components/dist/components";
import {
    useSubscribe,
    ReplicacheContext,
    Topic,
} from "@unclutter/library-components/dist/store";
import { useLocation } from "wouter";

export default function TopicsListTab({ setSelectedTopicId }) {
    const rep = useContext(ReplicacheContext);
    const groups = useSubscribe(rep, rep?.subscribe.groupTopics(), null);

    return (
        <div className="grid w-full grid-cols-4 gap-3 p-3 xl:grid-cols-6">
            {groups?.length === 0 && <NoTopicsMessage />}

            {groups?.map((group) => (
                <GroupedTopics
                    key={group.groupTopic.id}
                    {...group}
                    setSelectedTopicId={setSelectedTopicId}
                />
            ))}
        </div>
    );
}

function GroupedTopics({
    groupTopic,
    children,
    setSelectedTopicId,
}: {
    groupTopic: Topic;
    children: Topic[];
    setSelectedTopicId: Function;
}) {
    const [location, setLocation] = useLocation();

    return (
        <div
            className={clsx(
                "border-1 -m-[1px] rounded-lg border-stone-200 bg-white p-5 pt-3 shadow-sm dark:border-stone-700 dark:bg-stone-800",
                children.length >= 20
                    ? "col-span-4 xl:col-span-6"
                    : children.length >= 8
                    ? "col-span-4"
                    : children.length >= 3
                    ? "col-span-2"
                    : ""
            )}
        >
            <h2 className="font-title mb-5 flex items-center text-xl font-bold">
                {groupTopic.emoji && <TopicEmoji emoji={groupTopic.emoji} />}
                <div className="max-w-full overflow-hidden overflow-ellipsis whitespace-nowrap">
                    {groupTopic.name}
                </div>
            </h2>
            <div className="flex flex-wrap gap-1.5">
                {children?.map(({ id }) => (
                    <TopicTag
                        key={id}
                        topic_id={id.toString()}
                        colorSeed={groupTopic.id}
                        onClick={
                            setSelectedTopicId &&
                            (() => {
                                setSelectedTopicId(id);
                                setLocation("/");
                            })
                        }
                    />
                ))}
            </div>
        </div>
    );
}
