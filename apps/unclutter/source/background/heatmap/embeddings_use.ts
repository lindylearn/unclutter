import * as tf from "@tensorflow/tfjs";
import {
    load as loadUSE,
    UniversalSentenceEncoder,
} from "@tensorflow-models/universal-sentence-encoder";
import { Tensor2D } from "@tensorflow/tfjs";
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
    // performance help? https://github.com/tensorflow/tfjs/issues/6678
    tf.ENV.set("WEBGL_EXP_CONV", true);

    // https://tfjs-benchmarks.web.app/local-benchmark/
    tf.ENV.set("KEEP_INTERMEDIATE_TENSORS", false);
    tf.ENV.set("WEBGL_USE_SHAPES_UNIFORMS", true);

    // warmup run
    const tensor = await getEmbeddingsUSE(["test"]);
    tensor.dispose();

    console.log(
        `Loaded ${tf.getBackend()} USE model in ${Math.round(performance.now() - useStart)}ms`
    );
}

export async function getEmbeddingsUSE(
    sentences: string[],
    batchSize = 10,
    retry: boolean = true
): Promise<Tensor2D> {
    if (!useModel) {
        await loadEmbeddingsModelUSE();
    }
    try {
        const start = performance.now();

        // embed without whitespace (which is needed for anchoring)
        const cleanSentences = sentences.map((s) => s.replace(/[\s\n]+/g, " ").trim());

        let embeddings: Tensor2D[] = [];
        for (let i = 0; i < cleanSentences.length; i += batchSize) {
            const batch = cleanSentences.slice(i, i + batchSize);

            const tensor = await useModel.embed(batch);
            embeddings.push(tensor);

            // await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const combined = tf.concat(embeddings, 0);
        embeddings.forEach((e) => e.dispose());

        const end = performance.now();
        console.log(`Computed ${cleanSentences.length} embeddings in ${Math.round(end - start)}ms`);

        return combined;
    } catch (err) {
        console.error(err);

        // maybe 'tensor disposed' is caused by memory cleanup?

        if (retry) {
            console.log("Retrying embed once...");
            useModel = undefined; // re-load model
            return getEmbeddingsUSE(sentences, batchSize, false);
        }

        throw err;
    }
}
