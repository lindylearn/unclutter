import type { PokeBackend } from "./poke.js";

type Listener = () => void;
type ListenerMap = Map<string, Set<Listener>>;

// Implements the poke backend using server-sent events.
export class SSEPokeBackend implements PokeBackend {
  private _listeners: ListenerMap;

  constructor() {
    this._listeners = new Map();
  }

  async initSchema(): Promise<void> {
    // No schema support necessary for SSE poke.
  }

  addListener(spaceID: string, listener: () => void) {
    let set = this._listeners.get(spaceID);
    if (!set) {
      set = new Set();
      this._listeners.set(spaceID, set);
    }
    set.add(listener);
    return () => this._removeListener(spaceID, listener);
  }

  poke(spaceID: string) {
    const set = this._listeners.get(spaceID);
    if (!set) {
      return;
    }
    for (const listener of set) {
      try {
        listener();
      } catch (e) {
        console.error(e);
      }
    }
  }

  private _removeListener(spaceID: string, listener: () => void) {
    const set = this._listeners.get(spaceID);
    if (!set) {
      return;
    }
    set.delete(listener);
  }
}
