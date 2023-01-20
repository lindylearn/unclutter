import type { RuntimeReplicache } from "../../store";
import { saveAs } from "file-saver";

export async function generateCSV(rep: RuntimeReplicache) {
    const articles = await rep?.query.listArticles();
    const annotations = await rep?.query.listAnnotations();
    if (!articles || !annotations) {
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
    saveAs(blob, "articles.csv");

    const header2 = Object.keys(annotations[0]).join(",");
    const rows2 = annotations.map((article) =>
        Object.values(article)
            .map((value) => (value?.toString().includes(",") ? `"${value}"` : value))
            .join(",")
    );
    const bytes2 = new TextEncoder().encode([header2].concat(rows2).join("\r\n") + "\r\n");
    const blob2 = new Blob([bytes2], {
        type: "data:text/csv;charset=utf-8",
    });
    saveAs(blob2, "highlights.csv");
}
