import React, { useContext, useEffect, useState } from "react";
import ky from "ky";
import { Annotation, Article, ReplicacheContext, useSubscribe } from "../../store";
import { Highlight } from "../Highlight";
import { ReviewChart } from "./ReviewChart";
import { ArticleActivityCalendar } from "../Charts";
import { getWeekStart, subtractWeeks } from "../../common";

export default function ArticleBottomReview({ articleId }: { articleId: string }) {
    const rep = useContext(ReplicacheContext);

    const defaultWeekOverlay = 3;

    const [allArticles, setAllArticles] = useState<Article[]>();
    const [allAnnotations, setAllAnnotations] = useState<Annotation[]>();
    useEffect(() => {
        if (!rep) {
            return;
        }
        rep.query.listRecentArticles().then(setAllArticles);
        rep.query.listAnnotations().then(setAllAnnotations);
    }, [rep]);

    const [start, setStart] = useState<Date>();
    const [end, setEnd] = useState<Date>(new Date());
    const [startWeeksAgo, setStartWeeksAgo] = useState(defaultWeekOverlay);
    useEffect(() => {
        const end = getWeekStart(new Date());
        const start = subtractWeeks(end, startWeeksAgo - 1);
        setStart(start);
    }, [startWeeksAgo]);

    const darkModeEnabled = false;

    return (
        <div className="bottom-review flex flex-col gap-4 text-stone-800 dark:text-[rgb(232,230,227)]">
            <div className="relative mx-auto flex w-[780px] flex-col gap-4 overflow-hidden rounded-lg bg-white p-4 shadow dark:bg-[#212121]">
                <ArticleActivityCalendar
                    articles={allArticles}
                    darkModeEnabled={darkModeEnabled}
                    startWeeksAgo={startWeeksAgo}
                    setStartWeeksAgo={setStartWeeksAgo}
                    // reportEvent={reportEvent}
                />
            </div>
        </div>
    );
}
