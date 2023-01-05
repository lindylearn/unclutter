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
    // tf.enableDebugMode();

    // WASM backend uses worker, which doesn't work inside the background service worker
    // wasm.setWasmPaths("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/wasm-out/");
    // wasm.setThreadsCount(4);
    // await tf.setBackend("wasm");

    await tf.ready();

    useModel = await loadUSE();

    // prevent unbounded memory growth, see https://github.com/tensorflow/tfjs/issues/4127
    tf.ENV.set("WEBGL_DELETE_TEXTURE_THRESHOLD", 256 * 1024 * 1024); // 256MB

    // works?
    tf.ENV.set("KEEP_INTERMEDIATE_TENSORS", false);

    console.log(
        `Loaded ${tf.getBackend()} USE model in ${Math.round(performance.now() - useStart)}ms`
    );
}

export async function getEmbeddingsUSE(sentences: string[], batchSize = 100): Promise<number[][]> {
    if (!useModel) {
        await loadEmbeddingsModelUSE();
    }

    // embed without whitespace (which is needed for anchoring)
    const cleanSentences = sentences.map((s) => s.replace(/[\s\n]+/g, " ").trim());

    tf.engine().startScope();

    const start = performance.now();

    let embeddings: number[][] = [];
    for (let i = 0; i < cleanSentences.length; i += batchSize) {
        const batch = cleanSentences.slice(i, i + batchSize);

        const tensor = await useModel.embed(batch);
        const data = await tensor.array();
        embeddings.push(...data);

        tensor.dispose();

        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const end = performance.now();
    console.log(`Computed ${cleanSentences.length} embeddings in ${Math.round(end - start)}ms`);

    return embeddings;
}

export function cleanupEmbeddings() {
    tf.disposeVariables();
    tf.engine().endScope();
}
