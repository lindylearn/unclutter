import partition from "lodash/partition";
import { LindyAnnotation } from "../../common/annotations/create";

// group annotations that appear closely together, to display them with correct margins
export function groupAnnotations(
    annotations: LindyAnnotation[],
    groupTrailingMargin: number
): LindyAnnotation[][] {
    if (annotations.length === 0) {
        return [];
    }

    const orderedAnnotations: LindyAnnotation[] = annotations
        .filter((a) => a.displayOffset !== undefined)
        .sort((a, b) => a.displayOffset - b.displayOffset);

    let groupedAnnotations: LindyAnnotation[][] = [];
    let lastOffset = -Infinity;
    for (const annotation of orderedAnnotations) {
        if (annotation.displayOffset < lastOffset + groupTrailingMargin) {
            // conflict, append to last group
            groupedAnnotations[groupedAnnotations.length - 1] = [
                ...groupedAnnotations[groupedAnnotations.length - 1],
                annotation,
            ];
        } else {
            // no conflict, start new group
            groupedAnnotations.push([annotation]);
        }
        lastOffset = annotation.displayOffsetEnd;
    }

    // groupedAnnotations = groupedAnnotations.map((groupList) => {
    //     // show all personal or info annotations
    //     const [staticAnnotations, socialComments] = partition(
    //         groupList,
    //         (a) => a.isMyAnnotation || a.platform === "info" || a.platform === "summary"
    //     );

    //     // but filter social comments
    //     const bestSocialComments = socialComments
    //         .sort((a, b) => {
    //             // prefer more replies
    //             if (b.reply_count !== a.reply_count) {
    //                 return b.reply_count - a.reply_count;
    //             }

    //             // prefer longer comments
    //             return b.text.length - a.text.length;
    //         })
    //         .slice(0, 1);

    //     // Order by appearance
    //     return bestSocialComments
    //         .concat(staticAnnotations)
    //         .sort((a, b) => a.displayOffset - b.displayOffset);
    // });

    return groupedAnnotations;
}
