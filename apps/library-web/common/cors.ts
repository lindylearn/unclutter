import { NextApiRequest, NextApiResponse } from "next";

export function handleCors(req: NextApiRequest, res: NextApiResponse<any>): boolean {
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
        res.setHeader("Access-Control-Allow-Headers", "*");

        res.status(204).json({});
        return true;
    }

    return false;
}
