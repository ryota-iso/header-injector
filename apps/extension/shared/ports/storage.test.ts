import { SETTINGS_STORAGE_KEY, createDefaultSettings, type ExtensionSettings } from "@header-injector/core";
import { describe, expect, it, vi } from "vitest";

import { ExtensionSettingsRepository, type KeyValueStorage } from "./storage";

class MemoryStorage implements KeyValueStorage {
  readonly #values = new Map<string, unknown>();
  readonly #listeners = new Map<string, Set<(value: unknown) => void>>();

  async get<T>(key: string, fallback: T): Promise<T> {
    return (this.#values.get(key) as T | undefined) ?? fallback;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.#values.set(key, value);
    this.emit(key, value);
  }

  watch<T>(key: string, callback: (value: T) => void): () => void {
    const listeners = this.#listeners.get(key) ?? new Set<(value: unknown) => void>();
    listeners.add(callback as (value: unknown) => void);
    this.#listeners.set(key, listeners);

    return () => {
      listeners.delete(callback as (value: unknown) => void);
    };
  }

  seed(key: string, value: unknown) {
    this.#values.set(key, value);
  }

  emit(key: string, value: unknown) {
    for (const listener of this.#listeners.get(key) ?? []) {
      listener(value);
    }
  }
}

describe("ExtensionSettingsRepository", () => {
  it("未保存時はdefault settingsを返す", async () => {
    const repository = new ExtensionSettingsRepository(new MemoryStorage());

    await expect(repository.load()).resolves.toEqual(createDefaultSettings());
  });

  it("version不一致の保存値はdefault settingsへフォールバックする", async () => {
    const storage = new MemoryStorage();
    storage.seed(SETTINGS_STORAGE_KEY, { ...createDefaultSettings(), version: 2 });

    const repository = new ExtensionSettingsRepository(storage);

    await expect(repository.load()).resolves.toEqual(createDefaultSettings());
  });

  it("save後に同じ値をloadできる", async () => {
    const storage = new MemoryStorage();
    const repository = new ExtensionSettingsRepository(storage);
    const nextSettings: ExtensionSettings = {
      ...createDefaultSettings(),
      enabled: true,
      target: {
        includePatterns: ["https://api.example.com/*"],
        excludePatterns: [],
        resourceTypes: ["xmlhttprequest"],
      },
      headers: [{ id: "header-1", name: "Authorization", value: "Bearer token", enabled: true }],
    };

    await repository.save(nextSettings);

    await expect(repository.load()).resolves.toEqual(nextSettings);
  });

  it("watchは対象key以外の変更を無視する", async () => {
    const storage = new MemoryStorage();
    const repository = new ExtensionSettingsRepository(storage);
    const listener = vi.fn();
    const unsubscribe = repository.subscribe(listener);

    storage.emit("other-key", createDefaultSettings());
    storage.emit(SETTINGS_STORAGE_KEY, { ...createDefaultSettings(), enabled: true });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ ...createDefaultSettings(), enabled: true });

    unsubscribe();
  });
});
