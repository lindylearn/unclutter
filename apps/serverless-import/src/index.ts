import { Request, Response } from "express";
import { getHeatmap, loadHeatmapModel, RankedSentence } from "@unclutter/heatmap/dist/heatmap";
import { createAnnotations, listParagraphs } from "@unclutter/heatmap/dist/anchor";
import { fetchArticleParagraphs, fetchDocument } from "./fetch";
import "@tensorflow/tfjs-node";

loadHeatmapModel();

export async function main(req: Request, res: Response) {
    if (handledCors(req, res)) {
        return;
    }

    // just rank given paragraphs
    if (req.body?.paragraphs) {
        let paragraphs: string[] = req.body?.paragraphs;
        const sentences = await getHeatmap(paragraphs, 300, 100);
        res.send({ sentences });
        return;
    }

    // fetch html
    const url: string = req.body?.url;
    const articleId = req.body?.article_id;
    const scoreThreshold = req.body?.score_threshold || 0.6;
    const document = await fetchDocument(url);
    if (!document) {
        console.error("Failed to fetch document");
        res.status(400).send();
        return;
    }

    // parse DOM and extract significant text elements
    const [paragraphsElements, paragraphTexts] = listParagraphs(document, true);
    if (paragraphTexts.length === 0 || paragraphTexts.length >= 200) {
        // likely not an article
        // be careful, e.g. paulgraham.com has single paragraph
        console.error("Failed to extract paragraphs");
        res.status(400).send();
        return;
    }

    // run AI model
    let rankedSentencesByParagraph: RankedSentence[][] = await getHeatmap(paragraphTexts, 300, 100);

    // create annotations for significant detected quotes
    const annotations = createAnnotations(
        document,
        paragraphsElements,
        rankedSentencesByParagraph,
        articleId,
        scoreThreshold
    );

    res.send({ annotations });
}

export function handledCors(req: Request, res: Response<any>): boolean {
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
        res.setHeader("Access-Control-Allow-Headers", "*");

        res.status(204).json({});
        return true;
    }

    return false;
}

// main(
//     {
//         body: {
//             url: "https://stratechery.com/2015/netflix-and-the-conservation-of-attractive-profits/",
//             article_id: "test",
//         },
//     } as Request,
//     {
//         send: console.log,
//         status: (code: number) => {
//             console.log(code);
//             return {
//                 send: console.log,
//             };
//         },
//         setHeader: console.log,
//     } as Response
// );
