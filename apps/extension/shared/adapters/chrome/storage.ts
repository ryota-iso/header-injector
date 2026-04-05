import { ExtensionSettingsRepository, type KeyValueStorage } from "../../ports/storage";

interface StorageChange {
  newValue?: unknown;
}

interface StorageArea {
  get(items: Record<string, unknown>): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

interface StorageNamespace {
  local: StorageArea;
  onChanged: {
    addListener(listener: (changes: Record<string, StorageChange>, areaName: string) => void): void;
    removeListener(listener: (changes: Record<string, StorageChange>, areaName: string) => void): void;
  };
}

interface ChromeExtensionLike {
  storage: StorageNamespace;
}

export class ChromeStorage implements KeyValueStorage {
  readonly #extension: ChromeExtensionLike;

  constructor(extension = resolveChromeExtension()) {
    this.#extension = extension;
  }

  async get<T>(key: string, fallback: T): Promise<T> {
    const result = await this.#extension.storage.local.get({ [key]: fallback });
    return (result[key] as T | undefined) ?? fallback;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.#extension.storage.local.set({ [key]: value });
  }

  watch<T>(key: string, callback: (value: T) => void): () => void {
    const listener = (changes: Record<string, StorageChange>, areaName: string) => {
      if (areaName !== "local" || !(key in changes)) {
        return;
      }

      callback(changes[key]?.newValue as T);
    };

    this.#extension.storage.onChanged.addListener(listener);

    return () => {
      this.#extension.storage.onChanged.removeListener(listener);
    };
  }
}

export class ChromeSettingsRepository extends ExtensionSettingsRepository {
  constructor(storage = new ChromeStorage()) {
    super(storage);
  }
}

function resolveChromeExtension(): ChromeExtensionLike {
  const extension = (globalThis as typeof globalThis & { chrome?: ChromeExtensionLike }).chrome;

  if (!extension?.storage?.local || !extension.storage.onChanged) {
    throw new Error("Chrome storage API is not available");
  }

  return extension;
}
