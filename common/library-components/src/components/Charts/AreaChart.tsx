import React, { useMemo } from "react";
import { ResponsiveStream, StreamDatum } from "@nivo/stream";
import { Article } from "../../store";
import { getWeekNumber } from "../../common";

export function AreaChart({
    darkModeEnabled,
    articles,
}: {
    darkModeEnabled: boolean;
    articles?: Article[];
}) {
    const data = useMemo(() => {
        if (!articles) {
            return null;
        }
        return createTopicStreamData(articles);
    }, [articles]);

    return (
        <div className="h-56">
            {/* see https://nivo.rocks/stream/ */}
            <ResponsiveStream
                data={data || []}
                keys={[
                    "0_",
                    "1_",
                    "2_",
                    "3_",
                    "4_",
                    "5_",
                    "6_",
                    "7_",
                    "8_",
                    "9_",
                ]}
                margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
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

function createTopicStreamData(articles: Article[]): StreamDatum[] {
    const seenTopics = new Set<string>();

    const weekBuckets: { [week: string]: { [topic: string]: number } } = {};
    articles.forEach((article) => {
        const date = new Date(article.time_added * 1000);
        const year = date.getFullYear();
        const week = `${year}-${getWeekNumber(date)}`;
        // const week = `${year}-${date.getMonth()}`;

        if (!weekBuckets[week]) {
            weekBuckets[week] = {};
        }

        if (article.topic_id) {
            weekBuckets[week][article.topic_id] =
                (weekBuckets[week][article.topic_id] || 0) + 1;
            seenTopics.add(article.topic_id);
        }
    });

    Object.keys(weekBuckets).forEach((week) => {
        seenTopics.forEach((topic) => {
            if (!weekBuckets[week][topic]) {
                weekBuckets[week][topic] = 0;
            }
        });
    });

    return Object.values(weekBuckets).reverse();
}
