import { ArticleImportSchema } from "./Import";
import { CSVImportButtons } from "./CSV";

export function RaindropImportText() {
    return (
        <p className="">
            Create a new raindrop.io{" "}
            <a
                className="inline-block cursor-pointer font-bold transition-all hover:rotate-2"
                href="https://app.raindrop.io/settings/backups"
                target="_blank"
                rel="noreferrer"
            >
                file backup
            </a>
            , then upload the generated CSV file here once available.
        </p>
    );
}

export function RaindropImportButtons({ onError, startImport, transformRows = transformCSVRows }) {
    return (
        <CSVImportButtons
            onError={onError}
            startImport={startImport}
            transformRows={transformCSVRows}
        />
    );
}

function transformCSVRows(rows: string[]): ArticleImportSchema {
    const cells = rows
        .map((line) => line.split(","))
        .filter((cols) => cols?.[2]?.startsWith("http"));

    return {
        urls: cells.map((cols) => cols[2]),
        time_added: cells.map((cols) => Math.round(new Date(cols[5]).valueOf() / 1000)),
    };
}
