function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        const item = (value as Record<string, unknown>)[key];
        if (item !== undefined) result[key] = canonicalize(item);
        return result;
      }, {});
  }

  return value;
}

/**
 * Produces the same fingerprint for semantically identical JSON values even
 * when Postgres JSONB returns object keys in a different order.
 */
export function saveFingerprint(value: unknown) {
  return JSON.stringify(canonicalize(value));
}
