import { cosine_similarity_matrix } from "./groups";
// import { getEmbeddingsONNX, loadEmbeddingsModelONNX } from "./onnx/embeddings_onnx";
import { getEmbeddingsUSE, loadEmbeddingsModelUSE } from "./embeddings_use";
import { getParagraphSentences } from "./sentences";
import textRank from "./textrank";
import * as tf from "@tensorflow/tfjs";
import { Tensor2D } from "@tensorflow/tfjs";

interface RankedSentence {
    sentence: string;
    score: number;
}

export async function loadHeatmapModel(embeddingsType = "use") {
    if (embeddingsType === "onnx") {
        // await loadEmbeddingsModelONNX();
    } else if (embeddingsType === "use") {
        await loadEmbeddingsModelUSE();
    }
}

export async function getHeatmap(
    paragraphs: string[],
    embeddingsType = "use",
    maxSentences = 300
): Promise<RankedSentence[][]> {
    const t0 = performance.now();

    tf.engine().startScope();

    // split into sentences
    let [sentences, sentence_paragraph] = getParagraphSentences(paragraphs);
    sentences = sentences.slice(0, maxSentences);
    sentence_paragraph = sentence_paragraph.slice(0, maxSentences);
    if (sentences.length === 0) {
        return [];
    }

    // compute embeddings
    let embeddings: Tensor2D = await getEmbeddingsUSE(sentences);
    const matrix = (await tf.matMul(embeddings, embeddings.transpose()).array()) as number[][];

    // get sentence scores
    let sentenceScores = textRank(matrix);

    // combine related sentences
    [sentences, sentenceScores, sentence_paragraph] = combineRelatedSentences(
        sentences,
        sentenceScores,
        sentence_paragraph,
        matrix
    );

    // re-compute scores for on combined sentences
    // matrix = cosine_similarity_matrix(embeddings);
    // if (embeddingsType === "use") {
    //     tweakUSEMatrix(matrix);
    // }
    // sentenceScores = textRank(matrix);

    // pick the most interesting sentences
    pickLeadingSentences(sentences, sentenceScores, sentence_paragraph, matrix, 0.6);

    // group by paragraph again
    const groupedSentenceScores = groupSentenceScores(
        sentences,
        sentenceScores,
        sentence_paragraph
    );

    embeddings.dispose();
    tf.disposeVariables();
    tf.engine().endScope();

    console.log(`Computed heatmap in ${Math.round(performance.now() - t0)}ms`);

    return groupedSentenceScores;
}

function tweakUSEMatrix(matrix: number[][]) {
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix.length; j++) {
            matrix[i][j] = matrix[i][j] * 1.5;
        }
    }
}

function globalMMR(
    sentences: string[],
    sentenceScores: number[],
    sentence_paragraph: number[],
    matrix: number[][],
    topN = 10,
    diversity = 0.3
) {
    const mmrScores = sentenceScores.map((globalScore, i) => {
        // const similaritySum = matrix[i].reduce(
        //     (sum, similarity, j) => (i === j ? 0 : sum + similarity),
        //     0
        // );
        // const diversityScore = similaritySum / sentences.length;
        // const mmrScore = (1 - diversity) * globalScore - diversity * diversityScore;
        // console.log(mmrScore, globalScore, diversityScore, sentences[i]);

        return [globalScore, i];
    });

    const pickedIndexes = new Set(
        mmrScores
            .sort((a, b) => b[0] - a[0])
            .slice(0, topN)
            .map((e) => e[1])
    );

    for (let i = 0; i < sentences.length; i++) {
        if (pickedIndexes.has(i)) {
            continue;
        } else {
            sentenceScores[i] = 0.59;
        }
    }
}

function combineRelatedSentences(
    sentences: string[],
    sentenceScores: number[],
    sentence_paragraph: number[],
    matrix: number[][]
): [string[], number[], number[]] {
    // construct new
    const newSentences: string[] = [];
    const newSentenceScores: number[] = [];
    const newSentenceParagraph: number[] = [];

    // collect groups of related sentences
    let currentSentences = [sentences[0]];
    let currentSentenceScores = [sentenceScores[0]];
    let currentSentenceParagraph = [sentence_paragraph[0]];

    function closeCurrentGroup() {
        splitLargeHighlightGroup(
            currentSentences,
            currentSentenceScores,
            currentSentenceParagraph
        ).forEach(([sentences, scores, paragraph]) => {
            if (sentences.length > 0) {
                newSentences.push(sentences.join(" "));
                newSentenceScores.push(Math.max(...scores));
                newSentenceParagraph.push(paragraph[0]);
            }
        });
    }

    for (let i = 1; i < sentences.length; i++) {
        // compare to last sentence
        const similarity = matrix[i][i - 1];
        const scoreDifference = Math.abs(sentenceScores[i] - sentenceScores[i - 1]);

        // console.log(scoreDifference, similarity, [currentSentences.join(" "), sentences[i]]);
        if (
            sentence_paragraph[i] === sentence_paragraph[i - 1] &&
            (similarity > 0.6 || scoreDifference < 0.2)
        ) {
            // append to current group
            // console.log(scoreDifference, similarity, [currentSentences.join(" "), sentences[i]]);

            currentSentences.push(sentences[i]);
            currentSentenceScores.push(sentenceScores[i]);
            currentSentenceParagraph.push(sentence_paragraph[i]);

            continue;
        } else {
            // close last group

            closeCurrentGroup();
        }

        // start new group
        currentSentences = [sentences[i]];
        currentSentenceScores = [sentenceScores[i]];
        currentSentenceParagraph = [sentence_paragraph[i]];
    }

    // close last group
    closeCurrentGroup();

    return [newSentences, newSentenceScores, newSentenceParagraph];
}

function averageEmbeddings(embeddings: number[][]): number[] {
    const averageEmbedding = new Array(embeddings[0].length).fill(0);
    for (let i = 0; i < embeddings.length; i++) {
        for (let j = 0; j < embeddings[i].length; j++) {
            averageEmbedding[j] += embeddings[i][j];
        }
    }
    for (let j = 0; j < averageEmbedding.length; j++) {
        averageEmbedding[j] /= embeddings.length;
    }
    return averageEmbedding;
}

function splitLargeHighlightGroup(
    sentences: string[],
    sentenceScores: number[],
    sentenceParagraphs: number[],
    maxLen = 200
): [string[], number[], number[]][] {
    const groups: [string[], number[], number[]][] = [];
    if (sentences.length === 0) {
        return groups;
    }

    // expand from highest score sentence
    let start = sentenceScores.indexOf(Math.max(...sentenceScores));
    let end = start + 1;
    while (true) {
        const len = sentences.slice(start, end).join(" ").length;
        if (len > maxLen) {
            break;
        }

        if (
            start > 0 &&
            (end >= sentences.length || sentenceScores[start - 1] > sentenceScores[end])
        ) {
            start--;
        } else if (end < sentences.length) {
            end++;
        } else {
            break;
        }
    }
    // console.log(sentences, sentenceScores, start, end);

    if (start > 0) {
        groups.push(
            ...splitLargeHighlightGroup(
                sentences.slice(0, start),
                sentenceScores.slice(0, start),
                sentenceParagraphs.slice(0, start),
                maxLen
            )
        );
    }
    groups.push([
        sentences.slice(start, end),
        sentenceScores.slice(start, end),
        sentenceParagraphs.slice(start, end),
    ]);
    if (end < sentences.length) {
        groups.push(
            ...splitLargeHighlightGroup(
                sentences.slice(end),
                sentenceScores.slice(end),
                sentenceParagraphs.slice(end),
                maxLen
            )
        );
    }

    return groups;
}

function pickLeadingSentences(
    sentences: string[],
    sentenceScores: number[],
    sentence_paragraph: number[],
    matrix: number[][],
    theshold = 0.6,
    similarityWindow = 6,
    significantWindow = 1
) {
    for (let i = 0; i < sentences.length; i++) {
        if (sentenceScores[i] < theshold) {
            sentenceScores[i] = Math.min(sentenceScores[i], theshold - 0.01);
            continue;
        }

        // console.log("-----");
        // console.log(sentenceScores[i], sentences[i]);

        for (let j = i - 1; j >= Math.max(0, i - similarityWindow); j--) {
            const similarity = matrix[i][j];
            if (similarity > theshold || j >= i - significantWindow) {
                // console.log(similarity, sentenceScores[j], sentences[j]);

                if (sentenceScores[i] > sentenceScores[j]) {
                    sentenceScores[j] = Math.min(sentenceScores[j], theshold - 0.01);
                } else {
                    sentenceScores[i] = Math.min(sentenceScores[i], theshold - 0.01);
                    break;
                }
            }
        }
    }
}

function groupSentenceScores(
    sentences: string[],
    sentenceScores: number[],
    sentence_paragraph: number[]
): RankedSentence[][] {
    const groupedSentenceScores = [];
    for (let i = 0; i < sentence_paragraph.length; i++) {
        const paragraph = sentence_paragraph[i];
        if (groupedSentenceScores[paragraph] === undefined) {
            groupedSentenceScores[paragraph] = [];
        }
        groupedSentenceScores[paragraph].push({
            sentence: sentences[i],
            score: sentenceScores[i],
        });
    }
    return groupedSentenceScores;
}
