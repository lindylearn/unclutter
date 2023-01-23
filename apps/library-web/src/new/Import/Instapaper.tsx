import { SettingsButton } from "@unclutter/library-components/dist/components/Settings/SettingsGroup";
import { ArticleImportSchema } from "./Import";
import { CSVImportButtons } from "./CSV";

export function InstapaperImportText() {
    return (
        <p className="">
            Download your .CSV file export on the{" "}
            <a
                className="inline-block cursor-pointer font-bold transition-all hover:rotate-1"
                href="https://www.instapaper.com/user"
                target="_blank"
                rel="noreferrer"
            >
                Instapaper settings page
            </a>
            , then upload it here.
        </p>
    );
}

export function InstapaperImportButtons({
    onError,
    startImport,
    transformRows = transformCSVRows,
}) {
    return (
        <>
            <CSVImportButtons
                onError={onError}
                startImport={startImport}
                transformRows={transformRows}
            />
        </>
    );
}

function transformCSVRows(rows: string[]): ArticleImportSchema {
    const cells = rows
        .map((line) => line.split(","))
        .filter((cols) => cols?.[0]?.startsWith("http"));

    return {
        urls: cells.map((cols) => cols[0]),
        status: cells.map((cols) => (cols[3] === "Archive" ? 1 : 0)),
        time_added: cells.map((cols) => parseInt(cols[4])),
    };
}
