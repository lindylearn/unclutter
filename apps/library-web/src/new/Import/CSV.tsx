import { ArticleImportSchema } from "./Import";

export function CSVImportText({}) {
    return <p>Drop your .csv files here. One article URL per line please.</p>;
}

export function CSVImportButtons({ onError, startImport, transformRows = defaultRowTransform }) {
    const handleChange = async (event) => {
        const acceptedFiles: File[] = event.target.files;

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
    };

    return (
        <>
            <input className="" type="file" onChange={handleChange} accept="text/csv" />
        </>
    );
}

function defaultRowTransform(rows: string[]): ArticleImportSchema {
    const urls = rows.map((line) => line.split(",")[0]).filter((url) => url.startsWith("http"));

    return { urls };
}
