import type { NextApiRequest, NextApiResponse } from "next";
import { pull } from "../backend/pull.js";

export async function handlePull(req: NextApiRequest, res: NextApiResponse) {
  if (req.query["spaceID"] === undefined) {
    res.status(400).send("Missing spaceID");
    return;
  }
  const spaceID = req.query["spaceID"].toString() as string;
  const resp = await pull(spaceID, req.body);
  res.json(resp);
  res.end();
}
