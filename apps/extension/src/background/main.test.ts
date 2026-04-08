import { createDefaultSettings } from "../core";
import { describe, expect, it, vi } from "vitest";

import type { HeaderEngine } from "../core/ports/header-engine";
import { registerBackgroundListeners, resolveBackgroundTarget, startBackground, syncRules } from "./main";

describe("syncRules", () => {
  it("loadしたsettingsをruleへ変換してapplyRulesへ渡す", async () => {
    const repository = {
      load: vi.fn().mockResolvedValue({
        ...createDefaultSettings(),
        enabled: true,
        target: {
          includePatterns: ["https://api.example.com/*"],
          excludePatterns: [],
          resourceTypes: ["xmlhttprequest"],
        },
        headers: [{ id: "header-1", name: "X-Test", value: "1", enabled: true }],
      }),
    };
    const applyRules = vi.fn().mockResolvedValue(undefined);
    const headerEngine: HeaderEngine = {
      applyRules,
    };

    await syncRules(repository, headerEngine);

    expect(repository.load).toHaveBeenCalledTimes(1);
    expect(applyRules).toHaveBeenCalledWith([
      {
        id: 1,
        enabled: true,
        includePatterns: ["https://api.example.com/*"],
        excludePatterns: [],
        resourceTypes: ["xmlhttprequest"],
        requestHeaders: [{ header: "X-Test", operation: "set", value: "1" }],
      },
    ]);
  });
});

describe("resolveBackgroundTarget", () => {
  it("browser runtimeがある場合はSafari系を優先する", () => {
    expect(
      resolveBackgroundTarget({
        browser: { runtime: { onInstalled: { addListener() {} } } },
        chrome: { runtime: { onInstalled: { addListener() {} } } },
      }),
    ).toBe("safari");
  });

  it("chrome runtimeのみある場合はChrome系を選ぶ", () => {
    expect(resolveBackgroundTarget({ chrome: { runtime: { onInstalled: { addListener() {} } } } })).toBe("chrome");
  });

  it("runtimeが無い場合はnullを返す", () => {
    expect(resolveBackgroundTarget({ browser: {}, chrome: {} })).toBeNull();
  });
});

describe("registerBackgroundListeners", () => {
  it("install startup subscribeの各契機で同期関数を呼ぶ", async () => {
    const installedListeners: Array<() => void> = [];
    const startupListeners: Array<() => void> = [];
    const runtime = {
      onInstalled: {
        addListener(listener: () => void) {
          installedListeners.push(listener);
        },
      },
      onStartup: {
        addListener(listener: () => void) {
          startupListeners.push(listener);
        },
      },
    };
    let subscribeListener: ((settings: ReturnType<typeof createDefaultSettings>) => void) | undefined;
    const unsubscribe = vi.fn();
    const repository = {
      load: vi.fn(),
      subscribe: vi.fn((listener) => {
        subscribeListener = listener;
        return unsubscribe;
      }),
    };
    const synchronize = vi.fn().mockResolvedValue(undefined);

    const cleanup = registerBackgroundListeners(runtime, repository, synchronize);

    expect(repository.subscribe).toHaveBeenCalledTimes(1);
    expect(installedListeners).toHaveLength(1);
    expect(startupListeners).toHaveLength(1);

    installedListeners[0]();
    startupListeners[0]();
    subscribeListener?.(createDefaultSettings());
    await Promise.resolve();
    await Promise.resolve();

    expect(synchronize).toHaveBeenCalledTimes(3);

    cleanup();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe("startBackground", () => {
  it("開始時に1回同期してからlistener待機に入る", async () => {
    const repository = {
      load: vi.fn().mockResolvedValue({
        ...createDefaultSettings(),
        enabled: true,
        target: {
          includePatterns: ["https://api.example.com/*"],
          excludePatterns: [],
          resourceTypes: ["xmlhttprequest"],
        },
        headers: [{ id: "header-1", name: "X-Test", value: "1", enabled: true }],
      }),
      subscribe: vi.fn(() => vi.fn()),
    };
    const headerEngine = {
      applyRules: vi.fn().mockResolvedValue(undefined),
    };

    startBackground(
      {
        browser: {
          runtime: {
            onInstalled: { addListener() {} },
            onStartup: { addListener() {} },
          },
        },
      },
      {
        safari: {
          createRepository: () => repository,
          createHeaderEngine: () => headerEngine,
        },
        chrome: {
          createRepository: vi.fn(),
          createHeaderEngine: vi.fn(),
        },
      },
    );

    await Promise.resolve();
    await Promise.resolve();

    expect(repository.load).toHaveBeenCalledTimes(1);
    expect(headerEngine.applyRules).toHaveBeenCalledTimes(1);
    expect(repository.subscribe).toHaveBeenCalledTimes(1);
  });

  it("runtimeが無い場合は何も開始しない", () => {
    const safariRepository = vi.fn();
    const chromeRepository = vi.fn();
    const safariHeaderEngine = vi.fn();
    const chromeHeaderEngine = vi.fn();

    expect(
      startBackground(
        {},
        {
          safari: {
            createRepository: safariRepository,
            createHeaderEngine: safariHeaderEngine,
          },
          chrome: {
            createRepository: chromeRepository,
            createHeaderEngine: chromeHeaderEngine,
          },
        },
      ),
    ).toBeNull();

    expect(safariRepository).not.toHaveBeenCalled();
    expect(chromeRepository).not.toHaveBeenCalled();
    expect(safariHeaderEngine).not.toHaveBeenCalled();
    expect(chromeHeaderEngine).not.toHaveBeenCalled();
  });
});
