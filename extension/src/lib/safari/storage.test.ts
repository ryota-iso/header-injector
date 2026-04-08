import { afterEach, describe, expect, it, vi } from "vitest";

import { SafariStorage } from "./storage";

const globals = globalThis as typeof globalThis & {
  browser?: unknown;
  chrome?: unknown;
};

afterEach(() => {
  delete globals.browser;
  delete globals.chrome;
});

describe("SafariStorage", () => {
  it("browserがあればchromeより優先して使う", async () => {
    const browserGet = vi.fn().mockResolvedValue({ settings: { enabled: true } });
    const chromeGet = vi.fn().mockResolvedValue({ settings: { enabled: false } });

    globals.browser = {
      storage: {
        local: {
          get: browserGet,
          set: vi.fn(),
        },
        onChanged: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      },
    };
    globals.chrome = {
      storage: {
        local: {
          get: chromeGet,
          set: vi.fn(),
        },
        onChanged: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      },
    };

    const storage = new SafariStorage();

    await expect(storage.get("settings", { enabled: false })).resolves.toEqual({ enabled: true });
    expect(browserGet).toHaveBeenCalledTimes(1);
    expect(chromeGet).not.toHaveBeenCalled();
  });

  it("APIが存在しない場合は明示エラーを投げる", () => {
    expect(() => new SafariStorage()).toThrowError("Safari-compatible storage API is not available");
  });
});
