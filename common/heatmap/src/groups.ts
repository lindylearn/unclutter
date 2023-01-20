// import {} from "lodash";
// from https://jinglescode.github.io/2020/02/10/build-textual-similarity-analysis-web-app/

function dot(a: number[], b: number[]): number {
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var sum = 0;
    for (var key in a) {
        if (hasOwnProperty.call(a, key) && hasOwnProperty.call(b, key)) {
            sum += a[key] * b[key];
        }
    }
    return sum;
}

export function similarity(a: number[], b: number[]): number {
    var magnitudeA = Math.sqrt(dot(a, a));
    var magnitudeB = Math.sqrt(dot(b, b));
    if (magnitudeA && magnitudeB) {
        return dot(a, b) / (magnitudeA * magnitudeB);
    } else {
        return NaN;
    }
}

export function cosine_similarity_matrix(matrix: number[][]): number[][] {
    let cosine_similarity_matrix: number[][] = [];
    for (let i = 0; i < matrix.length; i++) {
        let row: number[] = [];
        for (let j = 0; j < i; j++) {
            row.push(cosine_similarity_matrix[j][i]);
        }
        row.push(1);
        for (let j = i + 1; j < matrix.length; j++) {
            row.push(similarity(matrix[i], matrix[j]));
        }
        cosine_similarity_matrix.push(row);
    }
    return cosine_similarity_matrix;
}

export function form_groups(cosine_similarity_matrix: number[][], theshold: number): number[][] {
    const groups: { [key: number]: number[] } = {};
    const groupForIndex: { [key: number]: number } = {};

    for (let i = 0; i < cosine_similarity_matrix.length; i++) {
        if (!(i in groupForIndex)) {
            // add new group for unmatched i
            groupForIndex[i] = i;
            groups[i] = [i];
        }

        for (let j = i + 1; j < cosine_similarity_matrix[i].length; j++) {
            if (cosine_similarity_matrix[i][j] >= theshold) {
                if (j in groupForIndex) {
                    // merge group j into i
                    const groupI = groupForIndex[i];
                    const groupJ = groupForIndex[j];

                    if (groupI !== groupJ) {
                        for (const k of groups[groupJ]) {
                            console.log(k);
                            groupForIndex[k] = groupI;
                            groups[groupI].push(k);
                        }
                        delete groups[groupJ];
                    }
                } else {
                    // add single j to group of i
                    const groupI = groupForIndex[i];
                    console.log(groupI);
                    groupForIndex[j] = groupI;
                    groups[groupI].push(j);
                }
            }
        }
    }

    return Object.values(groups);
}
