import { SettingsButton } from "@unclutter/library-components/dist/components/Settings/SettingsGroup";
import { ArticleImportSchema } from "./Import";
import { CSVImportButtons } from "./CSV";
import { reportEventPosthog } from "../../../common/metrics";

export function InstapaperImportText() {
    return (
        <p className="">
            Please download your .CSV file export on the bottom of the Instapaper settings page,
            then upload it here.
        </p>
    );
}

export function InstapaperImportButtons({ onError, startImport, darkModeEnabled }) {
    return (
        <>
            <SettingsButton
                title="Open Instapaper settings"
                href="https://www.instapaper.com/user"
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
        .filter((cols) => cols?.[0]?.startsWith("http"));

    return {
        urls: cells.map((cols) => cols[0]),
        status: cells.map((cols) => (cols[3] === "Archive" ? 1 : 0)),
        time_added: cells.map((cols) => parseInt(cols[4])),
    };
}
