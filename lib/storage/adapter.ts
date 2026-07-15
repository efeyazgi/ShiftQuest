export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  keys(prefix?: string): Promise<string[]>;
  clear(): Promise<void>;
}

export class StorageAdapterError extends Error {
  constructor(
    readonly code: "UNAVAILABLE" | "READ_FAILED" | "WRITE_FAILED" | "INVALID_KEY",
    message: string,
  ) {
    super(message);
    this.name = "StorageAdapterError";
  }
}

function assertKey(key: string): void {
  if (!key.trim() || key.length > 200) {
    throw new StorageAdapterError("INVALID_KEY", "Storage key is invalid.");
  }
}

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

export class MemoryStorageAdapter implements StorageAdapter {
  private readonly values = new Map<string, unknown>();

  constructor(initialValues: Record<string, unknown> = {}) {
    for (const [key, value] of Object.entries(initialValues)) {
      this.values.set(key, cloneValue(value));
    }
  }

  async get<T>(key: string): Promise<T | null> {
    assertKey(key);
    const value = this.values.get(key);
    return value === undefined ? null : cloneValue(value as T);
  }

  async set<T>(key: string, value: T): Promise<void> {
    assertKey(key);
    this.values.set(key, cloneValue(value));
  }

  async remove(key: string): Promise<void> {
    assertKey(key);
    this.values.delete(key);
  }

  async keys(prefix = ""): Promise<string[]> {
    return [...this.values.keys()].filter((key) => key.startsWith(prefix)).sort();
  }

  async clear(): Promise<void> {
    this.values.clear();
  }
}

export class WebStorageAdapter implements StorageAdapter {
  constructor(
    private readonly storage: Storage,
    private readonly namespace = "shiftquest",
  ) {
    if (!namespace.trim()) {
      throw new StorageAdapterError("INVALID_KEY", "Storage namespace is invalid.");
    }
  }

  private namespacedKey(key: string): string {
    assertKey(key);
    return `${this.namespace}:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const serialized = this.storage.getItem(this.namespacedKey(key));
      return serialized === null ? null : (JSON.parse(serialized) as T);
    } catch {
      throw new StorageAdapterError("READ_FAILED", "Saved progress could not be read.");
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      this.storage.setItem(this.namespacedKey(key), JSON.stringify(value));
    } catch {
      throw new StorageAdapterError("WRITE_FAILED", "Progress could not be saved.");
    }
  }

  async remove(key: string): Promise<void> {
    try {
      this.storage.removeItem(this.namespacedKey(key));
    } catch {
      throw new StorageAdapterError("WRITE_FAILED", "Saved progress could not be removed.");
    }
  }

  async keys(prefix = ""): Promise<string[]> {
    const namespacePrefix = `${this.namespace}:`;
    const matches: string[] = [];
    try {
      for (let index = 0; index < this.storage.length; index += 1) {
        const key = this.storage.key(index);
        if (!key?.startsWith(namespacePrefix)) continue;
        const unwrapped = key.slice(namespacePrefix.length);
        if (unwrapped.startsWith(prefix)) matches.push(unwrapped);
      }
      return matches.sort();
    } catch {
      throw new StorageAdapterError("READ_FAILED", "Saved progress keys could not be read.");
    }
  }

  async clear(): Promise<void> {
    const keys = await this.keys();
    try {
      for (const key of keys) this.storage.removeItem(this.namespacedKey(key));
    } catch {
      throw new StorageAdapterError("WRITE_FAILED", "Saved progress could not be cleared.");
    }
  }
}

export function createLocalStorageAdapter(
  namespace = "shiftquest",
): StorageAdapter {
  if (typeof window === "undefined" || !window.localStorage) {
    return new MemoryStorageAdapter();
  }

  try {
    const probe = `${namespace}:__probe__`;
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return new WebStorageAdapter(window.localStorage, namespace);
  } catch {
    return new MemoryStorageAdapter();
  }
}
