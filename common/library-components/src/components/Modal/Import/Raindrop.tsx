import React from "react";
import CSVImportSettings from "./CSV";
import { ArticleImportSchema } from "./_Import";

export default function RaindropImportSettings({ onError, startImport, disabled }) {
    return (
        <div className="px-3">
            <div className="mb-4 text-center">
                Please start a new raindrop.io{" "}
                <a
                    className="inline-block cursor-pointer font-medium transition-all hover:scale-[97%]"
                    href="https://app.raindrop.io/settings/backups"
                    target="_blank"
                    rel="noreferrer"
                >
                    file backup
                </a>
                .
            </div>
            <CSVImportSettings
                onError={onError}
                startImport={startImport}
                disabled={disabled}
                text="Then drop the generated .csv file here."
                transformRows={transformCSVRows}
            />
        </div>
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
