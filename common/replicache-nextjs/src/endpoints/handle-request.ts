import type { NextApiRequest, NextApiResponse } from "next";
import type { MutatorDefs } from "replicache";
import { handlePokeSSE } from "./replicache-poke-sse.js";
import { handlePull } from "./replicache-pull.js";
import { handlePush } from "./replicache-push.js";

export async function handleRequest<M extends MutatorDefs>(
  req: NextApiRequest,
  res: NextApiResponse,
  mutators: M
) {
  if (req.query === undefined) {
    res.status(400).send("Missing query");
    return;
  }
  const op = req.query["op"] as string;
  console.log(`\nHandling request ${req.url}, op: ${op}`);

  switch (op) {
    case "push":
      return await handlePush(req, res, mutators);
    case "pull":
      return await handlePull(req, res);
    case "poke-sse":
      return await handlePokeSSE(req, res);
  }

  res.status(404).send("route not found");
}
