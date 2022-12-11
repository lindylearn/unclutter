import React, { useContext, useEffect, useMemo, useState } from "react";
import { ResponsiveStream, StreamDatum } from "@nivo/stream";
import { Article, ReplicacheContext } from "../../store";
import { getWeekNumber } from "../../common";

export function ReviewChart({}: {}) {
    const rep = useContext(ReplicacheContext);

    const [keys, setKeys] = useState<string[]>();
    const [data, setData] = useState<StreamDatum[]>();
    useEffect(() => {
        if (!rep) {
            return;
        }

        rep.query.listArticles().then((articles) => {
            const [data, keys] = createTopicStreamData(articles);
            setData(data);
            setKeys(keys);
        });
    }, [rep]);

    return (
        <div className="h-56 w-full">
            {/* see https://nivo.rocks/stream/ */}
            <ResponsiveStream
                data={data || []}
                keys={keys || []}
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                axisTop={null}
                axisRight={null}
                axisBottom={null}
                axisLeft={null}
                enableGridX={false}
                enableGridY={false}
                offsetType="diverging"
                colors={{ scheme: "nivo" }}
                fillOpacity={0.85}
                borderColor={{ theme: "background" }}
                legends={[
                    {
                        anchor: "bottom-right",
                        direction: "column",
                        translateX: 100,
                        itemWidth: 80,
                        itemHeight: 20,
                        itemTextColor: "#999999",
                        symbolSize: 12,
                        symbolShape: "circle",
                        effects: [
                            {
                                on: "hover",
                                style: {
                                    itemTextColor: "#000000",
                                },
                            },
                        ],
                    },
                ]}
            />
        </div>
    );
}

function createTopicStreamData(articles: Article[]): [StreamDatum[], string[]] {
    const seenTopics = new Set<string>();

    const weekBuckets: { [week: string]: { [topic: string]: number } } = {};
    articles.forEach((article) => {
        const date = new Date(article.time_added * 1000);
        const year = date.getFullYear();
        const week = `${year}-${getWeekNumber(date)}`;

        if (!weekBuckets[week]) {
            weekBuckets[week] = {};
        }

        const key = article.publication_date?.slice(0, 4);
        if (key) {
            weekBuckets[week][key] = (weekBuckets[week][key] || 0) + 1;
            seenTopics.add(key);
        }
    });

    Object.keys(weekBuckets).forEach((week) => {
        seenTopics.forEach((topic) => {
            if (!weekBuckets[week][topic]) {
                weekBuckets[week][topic] = 0;
            }
        });
    });

    return [Object.values(weekBuckets).reverse(), Array.from(seenTopics)];
}
