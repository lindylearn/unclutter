import debounce from "lodash/debounce";
import React from "react";
import TextareaAutosize from "react-textarea-autosize";
import { LindyAnnotation } from "../../common/annotations/create";
import { getAnnotationColor } from "../../common/annotations/styling";
import { updateAnnotation as updateAnnotationApi } from "../common/CRUD";

function AnnotationDraft({
    url,
    annotation,
    className,
    deleteHideAnnotation,
    hypothesisSyncEnabled,
    isReply = false,
}) {
    // debounce to reduce API calls
    const debouncedUpdateApi: (
        annotation: LindyAnnotation
    ) => Promise<LindyAnnotation> = React.useCallback(
        debounce(updateAnnotationApi, 1000), // debounce so newest call eventually runs
        []
    );

    // keep local state
    const [localAnnotation, setLocalAnnotation] = React.useState(annotation);
    // patch correct id once annotation remotely created
    React.useEffect(() => {
        if (!localAnnotation.id && annotation.id) {
            const newAnnotation = { ...localAnnotation, id: annotation.id };
            setLocalAnnotation(newAnnotation);

            // synchronize potential local edits
            debouncedUpdateApi(newAnnotation);
        }
    }, [annotation.id]);
    async function updateAnnotationLocalFirst(newAnnotation: LindyAnnotation) {
        setLocalAnnotation(newAnnotation);

        if (!newAnnotation.id) {
            // synchronized once remotely created above
            return;
        }

        // call with newAnnotation as localAnnotation takes once loop iteration to update
        await debouncedUpdateApi(newAnnotation);
    }

    const [showDeleteConfirmation, setShowDeleteConfirmation] =
        React.useState(false);
    function deleteWithConfirmStep() {
        if (!showDeleteConfirmation) {
            setShowDeleteConfirmation(true);
            return;
        }

        deleteHideAnnotation();
    }

    const color = getAnnotationColor(annotation);

    return (
        <div
            className={
                `annotation p-1 pl-1.5 rounded-l-sm rounded-r bg-white text-gray-800 shadow-sm hover:shadow animate-slidein transition-all relative ` +
                (isReply ? "rounded-l pl-1 " : "") +
                (className || "")
            }
            style={{
                top: annotation.offset,
                // boxShadow: `-1.5px 0.5px 2px 0 ${color}`,
                borderLeft: !isReply ? `5px solid ${color}` : "",
            }}
        >
            <TextareaAutosize
                className="text-sm md:text-base w-full bg-gray-50 placeholder-gray-400 placeholder:select-none rounded py-1 pl-2 pr-6 outline-none align-top"
                placeholder={
                    (localAnnotation.isPublic ? "Public " : "Private ") +
                    (isReply ? "reply" : "note")
                }
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
            <div className="top-icons absolute top-1.5 right-1.5 p-1 flex gap-2 text-gray-400">
                <div
                    className="cursor-pointer hover:text-gray-600 hover:drop-shadow-md lindy-tooltip lindy-fade transition-all"
                    onClick={deleteWithConfirmStep}
                    data-title={
                        showDeleteConfirmation
                            ? "Click again to confirm"
                            : "Delete annotation"
                    }
                    onMouseLeave={() =>
                        // timout to fade-out tooltip first
                        setTimeout(() => setShowDeleteConfirmation(false), 200)
                    }
                >
                    <svg className="icon h-3.5" viewBox="0 0 448 512">
                        <path
                            fill="currentColor"
                            d="M424 80C437.3 80 448 90.75 448 104C448 117.3 437.3 128 424 128H412.4L388.4 452.7C385.9 486.1 358.1 512 324.6 512H123.4C89.92 512 62.09 486.1 59.61 452.7L35.56 128H24C10.75 128 0 117.3 0 104C0 90.75 10.75 80 24 80H93.82L130.5 24.94C140.9 9.357 158.4 0 177.1 0H270.9C289.6 0 307.1 9.358 317.5 24.94L354.2 80H424zM177.1 48C174.5 48 171.1 49.34 170.5 51.56L151.5 80H296.5L277.5 51.56C276 49.34 273.5 48 270.9 48H177.1zM364.3 128H83.69L107.5 449.2C108.1 457.5 115.1 464 123.4 464H324.6C332.9 464 339.9 457.5 340.5 449.2L364.3 128z"
                        />
                    </svg>
                </div>

                {hypothesisSyncEnabled && (
                    <div
                        className={
                            "cursor-pointer hover:text-gray-600 hover:drop-shadow-md lindy-tooltip lindy-fade transition-all " +
                            (localAnnotation.isPublic
                                ? "visible text-gray-600"
                                : "")
                        }
                        onClick={() =>
                            updateAnnotationLocalFirst({
                                ...localAnnotation,
                                isPublic: !localAnnotation.isPublic,
                            })
                        }
                        data-title={
                            localAnnotation.isPublic
                                ? "Set private"
                                : "Set public"
                        }
                    >
                        <svg className="h-3.5" viewBox="0 0 512 512">
                            <path
                                fill="currentColor"
                                d="M256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0zM256 464C263.4 464 282.1 456.8 303.6 415.6C312.4 397.9 319.1 376.4 325.6 352H186.4C192 376.4 199.6 397.9 208.4 415.6C229 456.8 248.6 464 256 464zM178.5 304H333.5C335.1 288.7 336 272.6 336 256C336 239.4 335.1 223.3 333.5 208H178.5C176.9 223.3 176 239.4 176 256C176 272.6 176.9 288.7 178.5 304V304zM325.6 160C319.1 135.6 312.4 114.1 303.6 96.45C282.1 55.22 263.4 48 256 48C248.6 48 229 55.22 208.4 96.45C199.6 114.1 192 135.6 186.4 160H325.6zM381.8 208C383.2 223.5 384 239.6 384 256C384 272.4 383.2 288.5 381.8 304H458.4C462.1 288.6 464 272.5 464 256C464 239.5 462.1 223.4 458.4 208H381.8zM342.1 66.61C356.2 92.26 367.4 124.1 374.7 160H440.6C419.2 118.9 384.4 85.88 342.1 66.61zM169.9 66.61C127.6 85.88 92.84 118.9 71.43 160H137.3C144.6 124.1 155.8 92.26 169.9 66.61V66.61zM48 256C48 272.5 49.93 288.6 53.57 304H130.2C128.8 288.5 128 272.4 128 256C128 239.6 128.8 223.5 130.2 208H53.57C49.93 223.4 48 239.5 48 256zM440.6 352H374.7C367.4 387.9 356.2 419.7 342.1 445.4C384.4 426.1 419.2 393.1 440.6 352zM137.3 352H71.43C92.84 393.1 127.6 426.1 169.9 445.4C155.8 419.7 144.6 387.9 137.3 352V352z"
                            />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
}
export default AnnotationDraft;
