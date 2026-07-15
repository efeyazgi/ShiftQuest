import "server-only";

import { createHash } from "node:crypto";

import type { TTSAudioResult, TTSRequest } from "./contracts";

type CacheEntry = {
  value: TTSAudioResult;
  expiresAt: number;
  lastAccessedAt: number;
};

export interface TTSCache {
  get(key: string): TTSAudioResult | null;
  set(key: string, value: TTSAudioResult): void;
  clear(): void;
}

function cloneAudio(value: TTSAudioResult): TTSAudioResult {
  return { ...value, audio: value.audio.slice(0) };
}

export class MemoryTTSCache implements TTSCache {
  private readonly entries = new Map<string, CacheEntry>();

  constructor(
    private readonly maxItems = 128,
    private readonly ttlMs = 24 * 60 * 60 * 1_000,
  ) {}

  get(key: string): TTSAudioResult | null {
    const entry = this.entries.get(key);
    if (!entry) return null;

    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return null;
    }

    entry.lastAccessedAt = Date.now();
    return cloneAudio(entry.value);
  }

  set(key: string, value: TTSAudioResult): void {
    if (this.entries.size >= this.maxItems && !this.entries.has(key)) {
      let oldestKey: string | undefined;
      let oldestAccess = Number.POSITIVE_INFINITY;
      for (const [candidateKey, entry] of this.entries.entries()) {
        if (entry.lastAccessedAt < oldestAccess) {
          oldestAccess = entry.lastAccessedAt;
          oldestKey = candidateKey;
        }
      }
      if (oldestKey) this.entries.delete(oldestKey);
    }

    const now = Date.now();
    this.entries.set(key, {
      value: cloneAudio(value),
      expiresAt: now + this.ttlMs,
      lastAccessedAt: now,
    });
  }

  clear(): void {
    this.entries.clear();
  }
}

export function createTTSCacheKey(providerId: string, input: TTSRequest): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        providerId,
        text: input.text.normalize("NFC"),
        language: input.language,
        voice: input.voice ?? null,
        speed: input.speed,
      }),
    )
    .digest("hex");
}
