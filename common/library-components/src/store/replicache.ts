import { createContext } from "react";
import {
    JSONValue,
    MutatorDefs,
    Replicache,
    ReadTransaction,
} from "replicache";

import { A } from "./accessors";
import { M } from "./mutators";

// allow rep.query.accessor1() syntax for compatibility with browser extension proxy
export interface CustomReplicache<A extends AccessorDefs, M extends MutatorDefs>
    extends Omit<Replicache<M>, "query" | "subscribe"> {
    query: MakeAccessors<A>;
    subscribe: any; //MakeSubscribables<A>;
}
export type RuntimeReplicache = CustomReplicache<A, M>;

export const ReplicacheContext = createContext<RuntimeReplicache | null>(null);

// copied from replicache interface, as not exported
declare type ToPromise<P> = P extends Promise<unknown> ? P : Promise<P>;
declare type AccessorReturn = Promise<JSONValue | undefined | null>;

export declare type AccessorDefs = {
    [key: string]: (tx: ReadTransaction, args?: any) => AccessorReturn;
};
declare type MakeAccessor<
    F extends (tx: ReadTransaction, ...args: [] | [JSONValue]) => AccessorReturn
> = F extends (tx: ReadTransaction, ...args: infer Args) => infer Ret
    ? (...args: Args) => ToPromise<Ret>
    : never;
declare type MakeAccessors<T extends AccessorDefs> = {
    [P in keyof T]: MakeAccessor<T[P]>;
};

// declare type MakeSubscribable<
//     F extends (tx: ReadTransaction, ...args: [] | [JSONValue]) => AccessorReturn
// > = F extends (tx: ReadTransaction, ...args: infer Args) => infer Ret
//     ? (...args: Args) => ToPromise<Ret>
//     : never;
// declare type MakeSubscribables<T extends AccessorDefs> = {
//     [P in keyof T]: MakeSubscribable<T[P]>;
// };
