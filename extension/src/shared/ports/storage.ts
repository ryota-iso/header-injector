import {
  DEFAULT_RESOURCE_TYPES,
  SETTINGS_STORAGE_KEY,
  SETTINGS_VERSION,
  createDefaultSettings,
  type ExtensionSettings,
  type HeaderEntry,
  type ResourceType,
} from "@header-injector/core";

export interface KeyValueStorage {
  get<T>(key: string, fallback: T): Promise<T>;
  set<T>(key: string, value: T): Promise<void>;
  watch<T>(key: string, callback: (value: T) => void): () => void;
}

export class ExtensionSettingsRepository {
  readonly #storage: KeyValueStorage;
  readonly #storageKey: string;

  constructor(storage: KeyValueStorage, storageKey = SETTINGS_STORAGE_KEY) {
    this.#storage = storage;
    this.#storageKey = storageKey;
  }

  async load(): Promise<ExtensionSettings> {
    const rawValue = await this.#storage.get<unknown>(this.#storageKey, createDefaultSettings());
    return normalizeSettings(rawValue);
  }

  async save(settings: ExtensionSettings): Promise<void> {
    await this.#storage.set(this.#storageKey, normalizeSettings(settings));
  }

  subscribe(listener: (settings: ExtensionSettings) => void): () => void {
    return this.#storage.watch<unknown>(this.#storageKey, (value) => {
      listener(normalizeSettings(value));
    });
  }
}

const resourceTypes = new Set<ResourceType>(DEFAULT_RESOURCE_TYPES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isResourceTypeArray(value: unknown): value is ResourceType[] {
  return Array.isArray(value) && value.every((item) => resourceTypes.has(item as ResourceType));
}

function isHeaderEntry(value: unknown): value is HeaderEntry {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.value === "string" &&
    typeof value.enabled === "boolean"
  );
}

function isExtensionSettings(value: unknown): value is ExtensionSettings {
  return (
    isRecord(value) &&
    value.version === SETTINGS_VERSION &&
    typeof value.enabled === "boolean" &&
    isRecord(value.target) &&
    isStringArray(value.target.includePatterns) &&
    isStringArray(value.target.excludePatterns) &&
    isResourceTypeArray(value.target.resourceTypes) &&
    Array.isArray(value.headers) &&
    value.headers.every((header) => isHeaderEntry(header))
  );
}

function cloneHeaderEntry(header: HeaderEntry): HeaderEntry {
  return { ...header };
}

export function normalizeSettings(value: unknown): ExtensionSettings {
  if (!isExtensionSettings(value)) {
    return createDefaultSettings();
  }

  return {
    version: SETTINGS_VERSION,
    enabled: value.enabled,
    target: {
      includePatterns: [...value.target.includePatterns],
      excludePatterns: [...value.target.excludePatterns],
      resourceTypes: [...value.target.resourceTypes],
    },
    headers: value.headers.map((header) => cloneHeaderEntry(header)),
  };
}
