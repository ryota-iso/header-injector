import { afterEach, describe, expect, it, vi } from "vitest";

import { ChromeStorage } from "./storage";

interface StorageChange {
  newValue?: unknown;
}

type StorageListener = (changes: Record<string, StorageChange>, areaName: string) => void;

const globals = globalThis as typeof globalThis & {
  chrome?: unknown;
};

afterEach(() => {
  delete globals.chrome;
});

describe("ChromeStorage", () => {
  it("chrome.storage.localへgetとsetを委譲する", async () => {
    const get = vi.fn().mockResolvedValue({ settings: { enabled: true } });
    const set = vi.fn().mockResolvedValue(undefined);

    globals.chrome = {
      storage: {
        local: { get, set },
        onChanged: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      },
    };

    const storage = new ChromeStorage();

    await expect(storage.get("settings", { enabled: false })).resolves.toEqual({ enabled: true });
    await storage.set("settings", { enabled: true });

    expect(get).toHaveBeenCalledWith({ settings: { enabled: false } });
    expect(set).toHaveBeenCalledWith({ settings: { enabled: true } });
  });

  it("watchでlocal areaの対象keyだけを通知する", () => {
    let listener: StorageListener | undefined;

    globals.chrome = {
      storage: {
        local: {
          get: vi.fn(),
          set: vi.fn(),
        },
        onChanged: {
          addListener: vi.fn().mockImplementation((callback: StorageListener) => {
            listener = callback;
          }),
          removeListener: vi.fn(),
        },
      },
    };

    const storage = new ChromeStorage();
    const callback = vi.fn();

    storage.watch("settings", callback);
    listener?.({ other: { newValue: 1 } }, "local");
    listener?.({ settings: { newValue: 2 } }, "sync");
    listener?.({ settings: { newValue: 3 } }, "local");

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(3);
  });

  it("APIが存在しない場合は明示エラーを投げる", () => {
    expect(() => new ChromeStorage()).toThrowError("Chrome storage API is not available");
  });
});
