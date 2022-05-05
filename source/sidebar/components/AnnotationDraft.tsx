import debounce from "lodash/debounce";
import React from "react";
import TextareaAutosize from "react-textarea-autosize";
import { LindyAnnotation } from "../../common/annotations/create";
import { getAnnotationColor } from "../../common/annotations/styling";
import { updateAnnotation } from "../common/CRUD";

function AnnotationDraft({
    url,
    annotation,
    className,
    deleteAnnotation,
    placeholder = "Private annotation",
}) {
    // keep local state buffer to reduce API calls
    const debouncedUpdate: (
        annotation: LindyAnnotation
    ) => Promise<LindyAnnotation> = React.useCallback(
        debounce(updateAnnotation, 1000),
        []
    );

    const [localAnnotation, setLocalAnnotation] = React.useState(annotation);
    async function updateAnnotationLocalFirst(newAnnotation: LindyAnnotation) {
        setLocalAnnotation(newAnnotation);

        const remoteAnnotation = await debouncedUpdate(newAnnotation);

        // remoteAnnotation is null if debounced call
        if (remoteAnnotation) {
            // patch correct id, but keep potentially newer local updates
            setLocalAnnotation((a) => ({
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
                `annotation p-1 pl-1.5 rounded-l-sm rounded-r bg-white text-gray-800 shadow-sm hover:shadow animate-slidein transition-all ` +
                (className || "")
            }
            style={{
                top: annotation.offset,
                // boxShadow: `-1.5px 0.5px 2px 0 ${color}`,
                borderLeft: `4px solid ${color}`,
            }}
        >
            <TextareaAutosize
                className="text-sm md:text-base w-full bg-gray-50 placeholder-gray-400 rounded py-1 px-2 outline-none align-top"
                placeholder={placeholder}
                value={localAnnotation.text}
                onChange={(e) =>
                    updateAnnotationLocalFirst({
                        ...localAnnotation,
                        text: e.target.value,
                    })
                }
                minRows={2}
                autoFocus={annotation.focused}
            />
            {/* <div className="flex gap-2">
                <input
                    className="text-sm md:text-base w-full bg-gray-50 rounded-md py-1 px-2 outline-none"
                    placeholder="Tags"
                    value={changedAnnotation.tags.join(", ")}
                    onChange={(e) =>
                        updateAnnotationHandler({
                            ...changedAnnotation,
                            tags: e.target.value.split(", "),
                        })
                    }
                />
                <Switch
                    annotationId={annotation.id}
                    value={changedAnnotation.isPublic}
                    toggleValue={() =>
                        updateAnnotationHandler({
                            ...changedAnnotation,
                            isPublic: !changedAnnotation.isPublic,
                        })
                    }
                />
            </div> */}
            <div className="top-icons absolute top-1.5 right-1.5 p-1 flex gap-3 text-gray-400 transition-all">
                <div
                    className="cursor-pointer hover:text-gray-600 hover:scale-110"
                    onClick={deleteAnnotation}
                >
                    <svg className="h-3.5" viewBox="0 0 448 512">
                        <path
                            fill="currentColor"
                            d="M135.2 17.69C140.6 6.848 151.7 0 163.8 0H284.2C296.3 0 307.4 6.848 312.8 17.69L320 32H416C433.7 32 448 46.33 448 64C448 81.67 433.7 96 416 96H32C14.33 96 0 81.67 0 64C0 46.33 14.33 32 32 32H128L135.2 17.69zM394.8 466.1C393.2 492.3 372.3 512 346.9 512H101.1C75.75 512 54.77 492.3 53.19 466.1L31.1 128H416L394.8 466.1z"
                        />
                    </svg>
                </div>

                {/* <div
                    className="cursor-pointer hover:text-gray-600 hover:scale-110"
                    // onClick={deleteAnnotation}
                >
                    <svg className="h-3" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M352 256C352 278.2 350.8 299.6 348.7 320H163.3C161.2 299.6 159.1 278.2 159.1 256C159.1 233.8 161.2 212.4 163.3 192H348.7C350.8 212.4 352 233.8 352 256zM503.9 192C509.2 212.5 512 233.9 512 256C512 278.1 509.2 299.5 503.9 320H380.8C382.9 299.4 384 277.1 384 256C384 234 382.9 212.6 380.8 192H503.9zM493.4 160H376.7C366.7 96.14 346.9 42.62 321.4 8.442C399.8 29.09 463.4 85.94 493.4 160zM344.3 160H167.7C173.8 123.6 183.2 91.38 194.7 65.35C205.2 41.74 216.9 24.61 228.2 13.81C239.4 3.178 248.7 0 256 0C263.3 0 272.6 3.178 283.8 13.81C295.1 24.61 306.8 41.74 317.3 65.35C328.8 91.38 338.2 123.6 344.3 160H344.3zM18.61 160C48.59 85.94 112.2 29.09 190.6 8.442C165.1 42.62 145.3 96.14 135.3 160H18.61zM131.2 192C129.1 212.6 127.1 234 127.1 256C127.1 277.1 129.1 299.4 131.2 320H8.065C2.8 299.5 0 278.1 0 256C0 233.9 2.8 212.5 8.065 192H131.2zM194.7 446.6C183.2 420.6 173.8 388.4 167.7 352H344.3C338.2 388.4 328.8 420.6 317.3 446.6C306.8 470.3 295.1 487.4 283.8 498.2C272.6 508.8 263.3 512 255.1 512C248.7 512 239.4 508.8 228.2 498.2C216.9 487.4 205.2 470.3 194.7 446.6H194.7zM190.6 503.6C112.2 482.9 48.59 426.1 18.61 352H135.3C145.3 415.9 165.1 469.4 190.6 503.6V503.6zM321.4 503.6C346.9 469.4 366.7 415.9 376.7 352H493.4C463.4 426.1 399.8 482.9 321.4 503.6V503.6z"
                        />
                    </svg>
                </div> */}
            </div>
        </div>
    );
}
export default AnnotationDraft;
