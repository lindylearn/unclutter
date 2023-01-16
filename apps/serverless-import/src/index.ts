import { Request, Response } from "express";
import { getHeatmap, loadHeatmapModel } from "@unclutter/heatmap/dist/heatmap";
import { fetchArticleParagraphs } from "./fetch";
import "@tensorflow/tfjs-node";

// loadHeatmapModel();

export async function main(req: Request, res: Response) {
    const url: string = req.body?.url;
    let paragraphs: string[] | undefined = req.body?.paragraphs;
    if (url) {
        paragraphs = await fetchArticleParagraphs(url);
    }

    if (!paragraphs) {
        res.status(400).send();
        return;
    }

    const sentences = await getHeatmap(paragraphs, 300, 50);

    res.send({ paragraphs, sentences });
}
