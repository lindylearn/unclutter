export default function textRank(
    similarities: number[][],
    dampening = 0.85,
    maxIterations = 10
): number[] {
    // similarities = similarities.map((row) => normalize(row));
    // console.log(similarities);

    let scores = Array(similarities.length).fill(1 / similarities.length);
    // console.log(scores);

    for (let _ = 0; _ < maxIterations; _++) {
        let newScores = Array(similarities.length).fill(0);

        for (let i = 0; i < similarities.length; i++) {
            // compute new score for sentence i
            for (let j = 0; j < similarities[0].length; j++) {
                if (i === j) {
                    continue;
                }

                // loop links from other sentences
                newScores[i] = newScores[i] + similarities[i][j] * scores[j];
            }

            // dampening (simulate random jumps)
            // newScores[i] = 1 - dampening + dampening * newScores[i];
        }

        // newScores = normalize(newScores);
        // console.log(newScores);

        let scoreDifference = 0;
        for (let i = 0; i < scores.length; i++) {
            scoreDifference += Math.abs(scores[i] - newScores[i]);
        }
        if (scoreDifference < 0.0001) {
            break;
        }

        scores = newScores;
    }

    scores = rescale(scores);

    return scores;
}

function normalize(arr: number[]): number[] {
    const sum = arr.reduce((a, b) => a + b, 0);
    return arr.map((x) => x / sum);
}

function rescale(arr: number[]): number[] {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    return arr.map((x) => (x - min) / (max - min));
}
