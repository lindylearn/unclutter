import { Request, Response } from "express";
import { getHeatmap, loadHeatmapModel } from "@unclutter/heatmap/dist/heatmap";
import { fetchArticleParagraphs } from "./fetch";
import "@tensorflow/tfjs-node";

loadHeatmapModel();

export async function main(req: Request, res: Response) {
    if (handledCors(req, res)) {
        return;
    }

    const url: string = req.body?.url;
    let paragraphs: string[] | undefined = req.body?.paragraphs;
    if (url) {
        paragraphs = await fetchArticleParagraphs(url);
    }

    if (!paragraphs) {
        res.status(400).send();
        return;
    }

    const sentences = await getHeatmap(paragraphs, 300, 100);

    res.send({ paragraphs, sentences });
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
