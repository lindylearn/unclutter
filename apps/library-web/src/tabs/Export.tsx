import { saveAs } from "file-saver";
import { useContext } from "react";
import { ReplicacheContext, listArticles } from "@unclutter/library-components/dist/store";

export default function ExportTab({}) {
    const rep = useContext(ReplicacheContext);
    async function generateJSON() {
        const articles = await rep?.query.listArticles();
        if (!articles) {
            return;
        }

        const bytes = new TextEncoder().encode(JSON.stringify(articles));
        const blob = new Blob([bytes], {
            type: "application/json;charset=utf-8",
        });
        saveAs(blob, "library.json");
    }
    async function generateCSV() {
        const articles = await rep?.query.listArticles();
        if (!articles) {
            return;
        }

        const header = Object.keys(articles[0]).join(",");
        const rows = articles.map((article) =>
            Object.values(article)
                .map((value) => (value?.toString().includes(",") ? `"${value}"` : value))
                .join(",")
        );

        const bytes = new TextEncoder().encode([header].concat(rows).join("\r\n") + "\r\n");
        const blob = new Blob([bytes], {
            type: "data:text/csv;charset=utf-8",
        });
        saveAs(blob, "library.csv");
    }

    return (
        <div className="m-5">
            <p>You can export all articles in your library at any time.</p>
            <p>Please tell me if you want support for a different export schema!</p>
            <div className="mt-3 flex gap-3">
                <button
                    className="bg-lindy dark:bg-lindyDark rounded-lg px-2 py-0.5 shadow-sm transition-all hover:scale-95 dark:text-stone-900"
                    onClick={generateJSON}
                >
                    Export .json file
                </button>
                <button
                    className="bg-lindy dark:bg-lindyDark rounded-lg px-2 py-0.5 shadow-sm transition-all hover:scale-95 dark:text-stone-900"
                    onClick={generateCSV}
                >
                    Export .csv file
                </button>
            </div>
        </div>
    );
}
