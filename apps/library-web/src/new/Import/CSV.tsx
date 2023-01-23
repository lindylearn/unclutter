import { SettingsButton } from "@unclutter/library-components/dist/components/Settings/SettingsGroup";
import { reportEventPosthog } from "../../../common/metrics";
import { ArticleImportSchema } from "./Import";

export function CSVImportText({}) {
    return <p>Upload other .csv lists here. The first column in each row should contain a URL.</p>;
}

export function CSVImportButtons({
    onError,
    startImport,
    transformRows = defaultRowTransform,
}: {
    onError: (message: string) => void;
    startImport: (importData: ArticleImportSchema) => void;
    transformRows?: (rows: string[]) => ArticleImportSchema;
}) {
    const handleChange = async (event) => {
        const acceptedFiles: File[] = [...event.target.files];

        if (acceptedFiles.length === 0) {
            onError("Invalid file selected");
            return;
        }

        const textContents = await Promise.all(
            acceptedFiles.map((file) => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onerror = () => {
                        onError("Error reading file");
                    };
                    reader.onload = () => {
                        resolve(reader.result as string);
                    };

                    reader.readAsText(file);
                });
            })
        );
        const textContent = textContents.join("\n");

        const rows = textContent.split("\n");
        const importData = transformRows(rows);
        if (importData.urls.length === 0) {
            onError("No valid URLs found in file");
        }

        startImport(importData);

        // reset
        event.target.value = "";
    };

    return (
        <>
            <input
                id="file-input"
                className="hidden"
                type="file"
                onChange={handleChange}
                accept="text/csv"
            />
            <SettingsButton
                title="Upload file"
                onClick={() => {
                    // can't properly style file input
                    document.getElementById("file-input")?.click();
                }}
                darkModeEnabled={false}
                reportEvent={reportEventPosthog}
            />
        </>
    );
}

function defaultRowTransform(rows: string[]): ArticleImportSchema {
    const urls = rows.map((line) => line.split(",")[0]).filter((url) => url.startsWith("http"));

    return { urls };
}
