import { z } from "zod";

import type { StorageAdapter } from "./adapter";

export type VersionedEnvelope<T> = {
  version: number;
  updatedAt: string;
  data: T;
};

export type Migration<T> = (oldData: unknown, oldVersion: number) => T;

export interface VersionedRepository<T> {
  load(): Promise<T | null>;
  save(value: T): Promise<void>;
  remove(): Promise<void>;
}

const envelopeSchema = z.object({
  version: z.number().int().nonnegative(),
  updatedAt: z.string(),
  data: z.unknown(),
});

export function createVersionedRepository<T>(options: {
  adapter: StorageAdapter;
  key: string;
  version: number;
  schema: z.ZodType<T>;
  migrate?: Migration<T>;
}): VersionedRepository<T> {
  const { adapter, key, version, schema, migrate } = options;

  return {
    async load(): Promise<T | null> {
      const stored = await adapter.get<unknown>(key);
      if (stored === null) return null;

      const envelope = envelopeSchema.safeParse(stored);
      if (!envelope.success) return null;

      if (envelope.data.version === version) {
        const parsed = schema.safeParse(envelope.data.data);
        return parsed.success ? parsed.data : null;
      }

      if (!migrate) return null;
      const migrated = schema.safeParse(
        migrate(envelope.data.data, envelope.data.version),
      );
      if (!migrated.success) return null;
      await this.save(migrated.data);
      return migrated.data;
    },

    async save(value: T): Promise<void> {
      const validated = schema.parse(value);
      const envelope: VersionedEnvelope<T> = {
        version,
        updatedAt: new Date().toISOString(),
        data: validated,
      };
      await adapter.set(key, envelope);
    },

    async remove(): Promise<void> {
      await adapter.remove(key);
    },
  };
}
