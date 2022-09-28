import { useEffect, useState } from "react";
import {
  MutatorDefs,
  Replicache,
  ReplicacheOptions,
  SubscribeOptions,
} from "replicache";
import type {
  CustomReplicache,
  AccessorDefs,
} from "@unclutter/library-components/dist/store/replicache";

import { getPokeReceiver } from "./poke.js";

export interface UseReplicacheOptions<
  A extends AccessorDefs,
  M extends MutatorDefs
> extends Omit<ReplicacheOptions<M>, "licenseKey" | "name"> {
  name?: string;
  apiHost?: string;
  accessors: A;
}

/**
 * Returns a Replicache instance with the given configuration.
 * If name is undefined, returns null.
 * If any of the values of the options change (by way of JS equals), a new
 * Replicache instance is created and the old one is closed.
 * Thus it is fine to say `useReplicache({name, mutators})`, as long as name
 * and mutators are stable.
 */
export function useReplicache<A extends AccessorDefs, M extends MutatorDefs>({
  name,
  ...options
}: UseReplicacheOptions<A, M>) {
  const [rep, setRep] = useState<CustomReplicache<A, M> | null>(null);

  useEffect(() => {
    if (!name) {
      setRep(null);
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return () => {};
    }

    const r = new Replicache({
      // See https://doc.replicache.dev/licensing for how to get a license key.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      licenseKey: process.env.NEXT_PUBLIC_REPLICACHE_LICENSE_KEY!,
      pushURL: `${options.apiHost || ""}/api/replicache/push?spaceID=${name}`,
      pullURL: `${options.apiHost || ""}/api/replicache/pull?spaceID=${name}`,
      name,
      ...options,
    });

    // Replicache uses an empty "poke" message sent over some pubsub channel
    // to know when to pull changes from the server. There are many ways to
    // implement pokes. This sample app implements two different ways.
    // By default, we use Server-Sent Events. This is simple, cheap, and fast,
    // but requires a stateful server to keep the SSE channels open. For
    // serverless platforms we also support pokes via Supabase. See:
    // - https://doc.replicache.dev/deploy
    // - https://doc.replicache.dev/how-it-works#poke-optional
    // - https://github.com/supabase/realtime
    // - https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
    const cancelReceiver = getPokeReceiver()(name, async () => r.pull());

    // add custom query and subscribe interface
    Object.keys(options.accessors).reduce((obj, fnName: keyof A) => {
      // @ts-ignore
      r.query[fnName] = (...args: any[]) =>
        r?.query((tx) => options.accessors[fnName](tx, ...args));

      // @ts-ignore
      r.subscribe[fnName] =
        (...args: any[]) =>
        (subscribeOptions: SubscribeOptions<any, Error>) =>
          r?.subscribe(
            (tx) => options.accessors[fnName](tx, ...args),
            subscribeOptions
          );

      return obj;
    }, {});

    setRep(r as unknown as CustomReplicache<A, M>);

    return () => {
      cancelReceiver();
      void r.close();
    };
  }, [name, ...Object.values(options)]);

  if (!rep) {
    return null;
  }

  return rep;
}
