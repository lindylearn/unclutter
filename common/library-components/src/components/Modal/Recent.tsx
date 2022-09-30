import {
    DraggableArticleList,
    useTabInfos,
    InlineProgressCircle,
} from "../../components";
import React, { useContext, useEffect, useState } from "react";
import { getRandomColor, getRandomLightColor } from "../../common";

export default function RecentModalTab({}) {
    const [tabInfos, allArticlesCount] = useTabInfos(10, true);

    return (
        <div className="flex flex-col gap-4 pt-1">
            {tabInfos?.map(({ key, title, icon, articles }, index) => (
                <div key={key} className="topic">
                    <div className="topic-header mx-0.5 flex justify-between">
                        <h2 className="title mb-2 flex items-center gap-2 font-medium">
                            {icon}
                            {title}
                        </h2>
                        <div className="stats font-medium text-stone-300">
                            <InlineProgressCircle
                                id={key}
                                current={articles.length}
                                target={10}
                            />
                            <span className="ml-1">
                                {10 - articles.length} unread
                            </span>
                        </div>
                    </div>
                    <div
                        className="topic-articles rounded-md p-3"
                        style={{
                            background:
                                key !== "continue"
                                    ? getRandomLightColor(key)
                                    : "hsl(51, 80%, 64%)",
                        }}
                    >
                        <DraggableArticleList
                            articles={articles}
                            articlesToShow={5}
                            sortPosition={
                                index === 0
                                    ? "recency_sort_position"
                                    : "topic_sort_position"
                            }
                            small
                            // reportEvent={reportEvent}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
