import * as tf from "@tensorflow/tfjs";
import {
    load as loadUSE,
    UniversalSentenceEncoder,
} from "@tensorflow-models/universal-sentence-encoder";
// import * as wasm from "@tensorflow/tfjs-backend-wasm";

let useModel: UniversalSentenceEncoder;
export async function loadEmbeddingsModelUSE() {
    if (useModel) {
        return;
    }

    const useStart = performance.now();
    console.log("Loading USE model...");

    tf.enableProdMode();

    // WASM backend uses worker, which doesn't work inside the background service worker
    // tf.enableDebugMode();
    // wasm.setWasmPaths("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/wasm-out/");
    // wasm.setThreadsCount(4);
    // await tf.setBackend("wasm");
    // await tf.ready();

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

        const tensor = await useModel.embed(batch);
        embeddings.push(...tensor.arraySync());
        tf.dispose(tensor);
        tf.disposeVariables();

        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const end = performance.now();
    console.log(`Computed ${sentences.length} embeddings in ${Math.round(end - start)}ms`);

    return embeddings;
}
