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
        .filter((a) => a.displayOffset)
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

    groupedAnnotations = groupedAnnotations.map((groupList) => {
        // show all personal annotations
        const myAnnotations = groupList.filter((a) => a.isMyAnnotation);

        // but filter social comments
        const bestSocialComments = groupList
            .filter((a) => !a.isMyAnnotation)
            .sort((a, b) => {
                // prefer more replies
                if (b.reply_count !== a.reply_count) {
                    return b.reply_count - a.reply_count;
                }

                // prefer longer comments
                return b.text.length - a.text.length;
            })
            .slice(0, 1);

        // Order by appearance
        return bestSocialComments
            .concat(myAnnotations)
            .sort((a, b) => a.displayOffset - b.displayOffset);
    });

    return groupedAnnotations;
}
