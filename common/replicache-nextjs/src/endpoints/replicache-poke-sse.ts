import type { NextApiRequest, NextApiResponse } from "next";
import { getPokeBackend } from "../backend/poke/poke.js";
import type { SSEPokeBackend } from "../backend/poke/sse.js";

export async function handlePokeSSE(req: NextApiRequest, res: NextApiResponse) {
  if (req.query["spaceID"] === undefined) {
    res.status(400).send("Missing spaceID");
    return;
  }
  const spaceID = req.query["spaceID"].toString() as string;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "text/event-stream;charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("X-Accel-Buffering", "no");

  res.write(`id: ${Date.now()}\n`);
  res.write(`data: hello\n\n`);

  const pokeBackend = getPokeBackend() as SSEPokeBackend;
  if (!pokeBackend.addListener) {
    throw new Error(
      "Unsupported configuration. Expected to be configured using server-sent events for poke."
    );
  }

  const unlisten = pokeBackend.addListener(spaceID, () => {
    res.write(`id: ${Date.now()}\n`);
    res.write(`data: poke\n\n`);
  });

  setInterval(() => {
    res.write(`id: ${Date.now()}\n`);
    res.write(`data: beat\n\n`);
  }, 30 * 1000);

  res.on("close", () => {
    unlisten();
  });
}
