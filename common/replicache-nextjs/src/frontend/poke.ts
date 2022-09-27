import {
  getSupabaseClientConfig,
  SupabaseClientConfig,
} from "../backend/supabase.js";
import { createClient } from "@supabase/supabase-js";

const supabaseClientConfig = getSupabaseClientConfig();

export type Receiver = (spaceID: string, onPoke: OnPoke) => Cancel;
export type OnPoke = () => Promise<void>;
export type Cancel = () => void;

// Returns a function that can be used to listen for pokes from the backend.
// This sample supports two different ways to do it.
export function getPokeReceiver(): Receiver {
  if (supabaseClientConfig) {
    return supabaseReceiver.bind(null, supabaseClientConfig);
  } else {
    return sseReceiver;
  }
}

// Implements a Replicache poke using Supabase's realtime functionality.
// See: backend/poke/supabase.ts.
function supabaseReceiver(
  supabaseClientConfig: SupabaseClientConfig,
  spaceID: string,
  onPoke: () => Promise<void>
) {
  if (!supabaseClientConfig) {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return () => {};
  }
  const { url, key } = supabaseClientConfig;
  const supabase = createClient(url, key);
  const subscription = supabase
    .from(`space:id=eq.${spaceID}`)
    .on("*", async () => {
      await onPoke();
    })
    .subscribe();
  return () => {
    subscription.unsubscribe();
  };
}

// Implements a Replicache poke using Server-Sent Events.
// See: backend/poke/sse.ts.
function sseReceiver(spaceID: string, onPoke: () => Promise<void>) {
  const ev = new EventSource(`/api/replicache/poke-sse?spaceID=${spaceID}`, {
    withCredentials: true,
  });
  ev.onmessage = async (event) => {
    if (event.data === "poke") {
      await onPoke();
    }
  };
  const close = () => {
    ev.close();
  };
  // See https://bugzilla.mozilla.org/show_bug.cgi?id=833462
  window.addEventListener("beforeunload", close);
  return () => {
    close();
    window.removeEventListener("beforeunload", close);
  };
}
