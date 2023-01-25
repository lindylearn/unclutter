import { ArticleImportSchema } from "./Import";
import { CSVImportButtons } from "./CSV";
import { SettingsButton } from "@unclutter/library-components/dist/components/Settings/SettingsGroup";
import { reportEventPosthog } from "../../../common/metrics";

export function RaindropImportText() {
    return (
        <p className="">
            Please create a new raindrop.io file backup, then upload the generated CSV file here
            once available.
        </p>
    );
}

export function RaindropImportButtons({ onError, startImport, darkModeEnabled }) {
    return (
        <>
            <SettingsButton
                title="Open Raindrop settings"
                href="https://app.raindrop.io/settings/backups"
                darkModeEnabled={darkModeEnabled}
                reportEvent={reportEventPosthog}
            />
            <CSVImportButtons
                onError={onError}
                startImport={startImport}
                transformRows={transformCSVRows}
            />
        </>
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
