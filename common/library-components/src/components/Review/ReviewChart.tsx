import React, { useContext, useEffect, useMemo, useState } from "react";
import { ResponsiveStream, StreamDatum } from "@nivo/stream";
import { Annotation, Article, ReplicacheContext, useSubscribe } from "../../store";
import { colors, getRandomLightColor, getWeekNumber, lightColors } from "../../common";
import { eachDayOfInterval, subWeeks } from "date-fns";

export function ReviewChart({}: {}) {
    const rep = useContext(ReplicacheContext);
    const annotations = useSubscribe<Annotation[]>(rep, rep?.subscribe.listAnnotations());

    const [keys, setKeys] = useState<string[]>();
    const [data, setData] = useState<StreamDatum[]>();
    useEffect(() => {
        if (!annotations || annotations.length === 0) {
            return;
        }

        let [data, keys] = createStreamData(annotations);

        // data = data.reverse();
        // data = data.slice(3, 4).concat(data.slice(0, 3)).concat(data.slice(4));

        setData(data);
        setKeys(keys);
    }, [annotations?.length]);

    const randomColors = useMemo(() => lightColors.sort(() => (Math.random() > 0.5 ? 1 : -1)), []);

    return (
        <div className="h-40 w-full">
            {/* see https://nivo.rocks/stream/ */}
            <ResponsiveStream
                data={data || []}
                keys={keys || []}
                margin={{ top: 20, right: 0, bottom: 0, left: 0 }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                    format: (value) => value,
                }}
                axisLeft={null}
                enableGridX={false}
                enableGridY={false}
                offsetType="diverging"
                colors={randomColors}
                fillOpacity={1}
                borderColor={{ theme: "background" }}
                enableStackTooltip={true}
                legends={[
                    {
                        anchor: "left",
                        direction: "column",
                        translateX: 20,
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

function createStreamData(annotations: Annotation[]): [StreamDatum[], string[]] {
    const since = subWeeks(new Date(), 1);

    const seenKeys = new Set<string>();
    const timeBuckets: { [bucket: string]: { [key: string]: number } } = {};
    eachDayOfInterval({
        start: since,
        end: new Date(),
    })
        .concat([new Date()])
        .map((date) => {
            const dateStr = date.toISOString().split("T")[0];
            timeBuckets[dateStr] = {};
        });

    annotations
        .filter((a) => a.created_at * 1000 >= since.getTime())
        .sort((a, b) => a.created_at - b.created_at)
        .forEach((annotation) => {
            const date = new Date(annotation.created_at * 1000);
            const day = date.toISOString().split("T")[0];
            const week = `${date.getFullYear()}-${getWeekNumber(date)}`;

            const bucket = day;
            if (!timeBuckets[bucket]) {
                timeBuckets[bucket] = {};
            }

            // annotation.tags?.map((tag) => {
            //     seenKeys.add(tag);
            //     timeBuckets[bucket][tag] = (timeBuckets[bucket][tag] || 0) + 1;
            // });
            // seenKeys.add("total");
            // timeBuckets[bucket]["total"] = (timeBuckets[bucket]["total"] || 0) + 1;

            const randomTags = ["#reading", "#note-taking", "#writing"];
            const tag = randomTags[Math.floor(Math.random() * randomTags.length)];
            seenKeys.add(tag);
            timeBuckets[bucket][tag] = (timeBuckets[bucket][tag] || 0) + 1;
        });

    // accumulate counts
    const timeBucketsList = Object.values(timeBuckets);
    for (let i = 0; i < timeBucketsList.length; i++) {
        const prev = timeBucketsList[i - 1];
        const curr = timeBucketsList[i];

        seenKeys.forEach((topic) => {
            curr[topic] = (curr[topic] || 0) + (prev?.[topic] || 0);
        });
    }

    return [timeBucketsList, Array.from(seenKeys)];
}
