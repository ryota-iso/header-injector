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

interface SafariStorageExtension {
  storage: StorageNamespace;
}

interface SafariHeaderEngineExtension {
  declarativeNetRequest: DeclarativeNetRequestNamespace;
}

export class SafariStorage implements KeyValueStorage {
  readonly #extension: SafariStorageExtension;

  constructor(extension = resolveSafariStorageExtension()) {
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

export class SafariHeaderEngine implements HeaderEngine {
  readonly #api: DeclarativeNetRequestNamespace;

  constructor(extension = resolveSafariHeaderEngineExtension()) {
    this.#api = extension.declarativeNetRequest;
  }

  async applyRules(rules: HeaderMutationRule[]): Promise<void> {
    const nextRules = createDynamicRules(rules);

    try {
      const currentRules = await this.#api.getDynamicRules();

      await this.#api.updateDynamicRules({
        removeRuleIds: currentRules.map((rule) => rule.id),
        addRules: nextRules,
      });
    } catch (error) {
      console.error("[header-injector/safari] applyRules:failed", error);
      throw error;
    }
  }
}

function resolveSafariStorageExtension(): SafariStorageExtension {
  const globals = globalThis as typeof globalThis & {
    browser?: SafariStorageExtension;
    chrome?: SafariStorageExtension;
  };

  const extension = globals.browser ?? globals.chrome;
  if (!extension?.storage?.local || !extension.storage.onChanged) {
    throw new Error("Safari-compatible storage API is not available");
  }

  return extension;
}

function resolveSafariHeaderEngineExtension(): SafariHeaderEngineExtension {
  const globals = globalThis as typeof globalThis & {
    browser?: SafariHeaderEngineExtension;
    chrome?: SafariHeaderEngineExtension;
  };

  const extension = globals.browser ?? globals.chrome;
  if (!extension?.declarativeNetRequest) {
    throw new Error("Safari-compatible declarativeNetRequest API is not available");
  }

  return extension;
}
