import { createContext } from "react";
import { Replicache } from "replicache";
import { M, mutators } from "./mutators";

export const ReplicacheContext = createContext<Replicache<M> | null>(null);
