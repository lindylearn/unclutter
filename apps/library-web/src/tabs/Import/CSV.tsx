import clsx from "clsx";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ArticleImportSchema } from "./_Import";

export default function CSVImportSettings({
    onError,
    startImport,
    disabled,
    text = "Drop your .csv files here. One article URL per line please.",
    transformRows = defaultRowTransform,
}) {
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
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
    }, []);
    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: { "text/csv": [".csv"] },
    });

    return (
        <div
            {...getRootProps({
                className: clsx(
                    "dropzone flex-grow",
                    disabled ? "cursor-not-allowed" : "cursor-pointer"
                ),
            })}
        >
            <input {...getInputProps()} disabled={disabled} />
            <p className="dark:bg-backgroundDark h-full rounded-lg bg-white p-5 text-center shadow-sm transition-all hover:scale-[98%]">
                {text}
            </p>
        </div>
    );
}

function defaultRowTransform(rows: string[]): ArticleImportSchema {
    const urls = rows.map((line) => line.split(",")[0]).filter((url) => url.startsWith("http"));

    return { urls };
}
