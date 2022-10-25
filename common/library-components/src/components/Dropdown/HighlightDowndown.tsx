import React from "react";
import { useContext } from "react";

import { ReplicacheContext } from "../../store";
import { Annotation } from "../../store/_schema";
import { Dropdown, DropdownItem } from "./Dropdown";

export function HighlightDropdown({
    annotation,
    open,
    setOpen,
    reportEvent = () => {},
}: {
    annotation: Annotation;
    open: boolean;
    setOpen: (open: boolean) => void;
    reportEvent?: (event: string, properties?: any) => void;
}) {
    const rep = useContext(ReplicacheContext);

    async function toggleFavorite(e) {
        e.stopPropagation();
        await rep?.mutate.updateAnnotation({
            id: annotation.id,
            is_favorite: !annotation.is_favorite,
        });
        reportEvent("toggleAnnotationFavorite", {
            newState: !annotation.is_favorite,
        });
    }

    async function deleteAnnotation() {
        await rep?.mutate.deleteAnnotation(annotation.id);
        reportEvent("deleteAnnotation");
    }

    return (
        <Dropdown open={open} setOpen={setOpen}>
            <DropdownItem
                title={annotation.is_favorite ? "Unfavorite" : "Favorite"}
                svg={
                    <svg
                        viewBox="0 0 576 512"
                        className="dropdown-elem -mt-0.5 mr-1.5 inline-block w-4"
                    >
                        {annotation.is_favorite ? (
                            <path
                                fill="currentColor"
                                d="M381.2 150.3L524.9 171.5C536.8 173.2 546.8 181.6 550.6 193.1C554.4 204.7 551.3 217.3 542.7 225.9L438.5 328.1L463.1 474.7C465.1 486.7 460.2 498.9 450.2 506C440.3 513.1 427.2 514 416.5 508.3L288.1 439.8L159.8 508.3C149 514 135.9 513.1 126 506C116.1 498.9 111.1 486.7 113.2 474.7L137.8 328.1L33.58 225.9C24.97 217.3 21.91 204.7 25.69 193.1C29.46 181.6 39.43 173.2 51.42 171.5L195 150.3L259.4 17.97C264.7 6.954 275.9-.0391 288.1-.0391C300.4-.0391 311.6 6.954 316.9 17.97L381.2 150.3z"
                            />
                        ) : (
                            <path
                                fill="currentColor"
                                d="M287.9 0C297.1 0 305.5 5.25 309.5 13.52L378.1 154.8L531.4 177.5C540.4 178.8 547.8 185.1 550.7 193.7C553.5 202.4 551.2 211.9 544.8 218.2L433.6 328.4L459.9 483.9C461.4 492.9 457.7 502.1 450.2 507.4C442.8 512.7 432.1 513.4 424.9 509.1L287.9 435.9L150.1 509.1C142.9 513.4 133.1 512.7 125.6 507.4C118.2 502.1 114.5 492.9 115.1 483.9L142.2 328.4L31.11 218.2C24.65 211.9 22.36 202.4 25.2 193.7C28.03 185.1 35.5 178.8 44.49 177.5L197.7 154.8L266.3 13.52C270.4 5.249 278.7 0 287.9 0L287.9 0zM287.9 78.95L235.4 187.2C231.9 194.3 225.1 199.3 217.3 200.5L98.98 217.9L184.9 303C190.4 308.5 192.9 316.4 191.6 324.1L171.4 443.7L276.6 387.5C283.7 383.7 292.2 383.7 299.2 387.5L404.4 443.7L384.2 324.1C382.9 316.4 385.5 308.5 391 303L476.9 217.9L358.6 200.5C350.7 199.3 343.9 194.3 340.5 187.2L287.9 78.95z"
                            />
                        )}
                    </svg>
                }
                onSelect={toggleFavorite}
                top
            />

            <DropdownItem
                title="Remove"
                svg={
                    <svg
                        viewBox="0 0 576 512"
                        className="dropdown-elem relative left-0.5 -mt-0.5 mr-1.5 inline-block w-4"
                    >
                        <path
                            fill="currentColor"
                            d="M424 80C437.3 80 448 90.75 448 104C448 117.3 437.3 128 424 128H412.4L388.4 452.7C385.9 486.1 358.1 512 324.6 512H123.4C89.92 512 62.09 486.1 59.61 452.7L35.56 128H24C10.75 128 0 117.3 0 104C0 90.75 10.75 80 24 80H93.82L130.5 24.94C140.9 9.357 158.4 0 177.1 0H270.9C289.6 0 307.1 9.358 317.5 24.94L354.2 80H424zM177.1 48C174.5 48 171.1 49.34 170.5 51.56L151.5 80H296.5L277.5 51.56C276 49.34 273.5 48 270.9 48H177.1zM364.3 128H83.69L107.5 449.2C108.1 457.5 115.1 464 123.4 464H324.6C332.9 464 339.9 457.5 340.5 449.2L364.3 128z"
                        />
                    </svg>
                }
                onSelect={deleteAnnotation}
            />
        </Dropdown>
    );
}
