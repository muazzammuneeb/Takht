import "server-only";
import os from "node:os";
import path from "node:path";
import { LocalStore } from "./local";
import type { Store } from "./store";
import { SupabaseStore } from "./supabase";

export type { Store } from "./store";

const g = globalThis as unknown as { __takhtStore?: Store };

/** The configured store: Supabase when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set, else local JSON. */
export function store(): Store {
  if (g.__takhtStore) return g.__takhtStore;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    g.__takhtStore = new SupabaseStore(url, key);
  } else {
    // Vercel's filesystem is read-only outside /tmp; locally keep data in the repo's .data/.
    const dir = process.env.TAKHT_DATA_DIR || (process.env.VERCEL ? path.join(os.tmpdir(), "takht") : path.join(process.cwd(), ".data"));
    g.__takhtStore = new LocalStore(dir);
  }
  return g.__takhtStore;
}
