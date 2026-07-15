export {
  createLocalStorageAdapter,
  MemoryStorageAdapter,
  StorageAdapterError,
  WebStorageAdapter,
} from "./adapter";
export type { StorageAdapter } from "./adapter";
export { createVersionedRepository } from "./repository";
export type {
  Migration,
  VersionedEnvelope,
  VersionedRepository,
} from "./repository";

/** Recommended keys inside the default `shiftquest` namespace. */
export const STORAGE_KEYS = {
  appState: "app-state",
  pendingSync: "pending-sync",
  audioCacheIndex: "audio-cache-index",
} as const;

export const CURRENT_STORAGE_VERSION = 1;
