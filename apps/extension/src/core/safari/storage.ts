import type { KeyValueStorage } from "../interfaces";
import { ExtensionSettingsRepository } from "../settings-repository";

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

interface BrowserExtensionLike {
  storage: StorageNamespace;
}

export class SafariStorage implements KeyValueStorage {
  readonly #extension: BrowserExtensionLike;

  constructor(extension = resolveSafariExtension()) {
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

export class SafariSettingsRepository extends ExtensionSettingsRepository {
  constructor(storage = new SafariStorage()) {
    super(storage);
  }
}

function resolveSafariExtension(): BrowserExtensionLike {
  const globals = globalThis as typeof globalThis & {
    browser?: BrowserExtensionLike;
    chrome?: BrowserExtensionLike;
  };

  const extension = globals.browser ?? globals.chrome;
  if (!extension?.storage?.local || !extension.storage.onChanged) {
    throw new Error("Safari-compatible storage API is not available");
  }

  return extension;
}
