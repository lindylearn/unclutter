import { Request, Response } from "express";
import { getHeatmap, loadHeatmapModel } from "@unclutter/heatmap/dist/heatmap";

loadHeatmapModel();

export async function main(req: Request, res: Response) {
    const paragraphs: string[] = req.body?.paragraphs;
    if (!paragraphs) {
        res.status(400).send();
        return;
    }

    const sentences = await getHeatmap(paragraphs);

    res.send({ sentences });
}
