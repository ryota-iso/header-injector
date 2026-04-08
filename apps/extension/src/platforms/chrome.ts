import { createDynamicRules, type DynamicRule } from "../core/dnr-rules";
import type { HeaderEngine, KeyValueStorage } from "../core/interfaces";
import type { HeaderMutationRule } from "../core/rules";
import { ExtensionSettingsRepository } from "../core/settings-repository";

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

interface DeclarativeNetRequestNamespace {
  getDynamicRules(): Promise<Array<{ id: number }>>;
  updateDynamicRules(update: { removeRuleIds: number[]; addRules: DynamicRule[] }): Promise<void>;
}

interface ChromeStorageExtension {
  storage: StorageNamespace;
}

interface ChromeHeaderEngineExtension {
  declarativeNetRequest: DeclarativeNetRequestNamespace;
}

export class ChromeStorage implements KeyValueStorage {
  readonly #extension: ChromeStorageExtension;

  constructor(extension = resolveChromeStorageExtension()) {
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

export class ChromeHeaderEngine implements HeaderEngine {
  readonly #api: DeclarativeNetRequestNamespace;

  constructor(extension = resolveChromeHeaderEngineExtension()) {
    this.#api = extension.declarativeNetRequest;
  }

  async applyRules(rules: HeaderMutationRule[]): Promise<void> {
    const currentRules = await this.#api.getDynamicRules();
    await this.#api.updateDynamicRules({
      removeRuleIds: currentRules.map((rule) => rule.id),
      addRules: createDynamicRules(rules),
    });
  }
}

function resolveChromeStorageExtension(): ChromeStorageExtension {
  const extension = (globalThis as typeof globalThis & { chrome?: ChromeStorageExtension }).chrome;

  if (!extension?.storage?.local || !extension.storage.onChanged) {
    throw new Error("Chrome storage API is not available");
  }

  return extension;
}

function resolveChromeHeaderEngineExtension(): ChromeHeaderEngineExtension {
  const extension = (globalThis as typeof globalThis & { chrome?: ChromeHeaderEngineExtension }).chrome;

  if (!extension?.declarativeNetRequest) {
    throw new Error("Chrome declarativeNetRequest API is not available");
  }

  return extension;
}
