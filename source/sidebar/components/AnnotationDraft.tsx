import debounce from "lodash/debounce";
import React from "react";
import { getAnnotationColor } from "../../common/annotations/styling";
import { createAnnotation, patchAnnotation } from "../common/api";

function AnnotationDraft({
    url,
    annotation,
    className,
    deleteAnnotation,
    placeholder = "Private note",
    swipeHandlers = {},
}) {
    const debouncedPatchOrCreate = React.useCallback(
        debounce(apiPatchOrCreate, 5000),
        []
    );

    const [changedAnnotation, setChangedAnnotation] =
        React.useState(annotation);
    async function updateAnnotation(newAnnotation) {
        setChangedAnnotation(newAnnotation);
        const remoteAnnotation = await debouncedPatchOrCreate(
            url,
            newAnnotation
        );
        // remoteAnnotation is null if debounced call
        if (remoteAnnotation && newAnnotation.is_draft) {
            // patch correct id to update in local state
            setChangedAnnotation((a) => ({
                ...a,
                id: remoteAnnotation.id,
                is_draft: false,
            }));
        }
    }

    const color = getAnnotationColor(annotation);

    return (
        <div
            className={
                `annotation py-1 px-1 rounded bg-white text-gray-800 shadow-s animate-slidein ` +
                (className || "")
            }
            style={{
                top: annotation.offset,
                // boxShadow: `-1.5px 0.5px 2px 0 ${color}`,
                borderLeft: `3px solid ${color}`,
            }}
            {...swipeHandlers}
        >
            <textarea
                className="text-sm md:text-base w-full bg-gray-50 placeholder-gray-400 rounded py-1 px-2 outline-none align-top"
                placeholder={placeholder}
                value={changedAnnotation.text}
                onChange={(e) =>
                    updateAnnotation({
                        ...changedAnnotation,
                        text: e.target.value,
                    })
                }
            />
            {/* <div className="flex gap-2">
                <input
                    className="text-sm md:text-base w-full bg-gray-50 rounded-md py-1 px-2 outline-none"
                    placeholder="Tags"
                    value={changedAnnotation.tags.join(", ")}
                    onChange={(e) =>
                        updateAnnotation({
                            ...changedAnnotation,
                            tags: e.target.value.split(", "),
                        })
                    }
                />
                <Switch
                    annotationId={annotation.id}
                    value={changedAnnotation.isPublic}
                    toggleValue={() =>
                        updateAnnotation({
                            ...changedAnnotation,
                            isPublic: !changedAnnotation.isPublic,
                        })
                    }
                />
            </div> */}
            <div className="top-icon absolute top-2 right-2 text-gray-400 cursor-pointer">
                {!changedAnnotation.is_draft && (
                    <svg
                        onClick={deleteAnnotation}
                        className="h-3"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 448 512"
                    >
                        <path
                            fill="currentColor"
                            d="M135.2 17.69C140.6 6.848 151.7 0 163.8 0H284.2C296.3 0 307.4 6.848 312.8 17.69L320 32H416C433.7 32 448 46.33 448 64C448 81.67 433.7 96 416 96H32C14.33 96 0 81.67 0 64C0 46.33 14.33 32 32 32H128L135.2 17.69zM394.8 466.1C393.2 492.3 372.3 512 346.9 512H101.1C75.75 512 54.77 492.3 53.19 466.1L31.1 128H416L394.8 466.1z"
                        />
                    </svg>
                )}
            </div>
        </div>
    );
}
export default AnnotationDraft;

async function apiPatchOrCreate(url, annotation) {
    if (annotation.is_draft) {
        return await createAnnotation(url, annotation);
    } else {
        return await patchAnnotation(annotation);
    }
}
