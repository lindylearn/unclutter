import * as tf from "@tensorflow/tfjs";
import {
    load as loadUSE,
    UniversalSentenceEncoder,
} from "@tensorflow-models/universal-sentence-encoder";
// import "@tensorflow/tfjs-backend-wasm";

let useModel: UniversalSentenceEncoder;
export async function loadEmbeddingsModelUSE() {
    if (useModel) {
        return;
    }

    const useStart = performance.now();
    console.log("Loading USE model...");

    tf.enableProdMode();
    // await tf.setBackend("wasm");

    useModel = await loadUSE();

    console.log(
        `Loaded ${tf.getBackend()} USE model in ${Math.round(performance.now() - useStart)}ms`
    );
}

export async function getEmbeddingsUSE(sentences: string[], batchSize = 20): Promise<number[][]> {
    if (!useModel) {
        await loadEmbeddingsModelUSE();
    }

    const start = performance.now();

    const embeddings: number[][] = [];
    for (let i = 0; i < sentences.length; i += batchSize) {
        const batch = sentences.slice(i, i + batchSize);

        embeddings.push(...(await useModel.embed(batch)).arraySync());
    }

    const end = performance.now();
    console.log(`Computed ${sentences.length} embeddings in ${Math.round(end - start)}ms`);

    return embeddings;
}
