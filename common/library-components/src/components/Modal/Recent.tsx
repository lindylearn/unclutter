import {
    StaticArticleList,
    DraggableArticleList,
    useTabInfos,
} from "../../components";
import React, { useContext, useEffect, useState } from "react";
import { getRandomColor } from "../../common";

export default function RecentModalTab({}) {
    const [tabInfos, allArticlesCount] = useTabInfos(10, true);

    return (
        <div className="flex flex-col gap-3">
            {tabInfos?.map(({ key, title, icon, articles }, index) => (
                <div
                    className="rounded-md p-3"
                    key={key}
                    style={{
                        background:
                            index > 0
                                ? getRandomColor(key).replace("0.4)", "0.15)")
                                : "rgba(237 215 91 / 40%)",
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
            ))}
        </div>
    );
}
