import { ArticleImportSchema } from "../Import";
import CSVImportSettings from "./CSV";

export default function InstapaperImportSettings({ onError, startImport, disabled }) {
    return (
        <div className="px-3">
            <div className="mb-3">
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
            </div>
            <CSVImportSettings
                onError={onError}
                startImport={startImport}
                disabled={disabled}
                text="Please drop the .csv file here."
                transformRows={transformCSVRows}
            />
        </div>
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
