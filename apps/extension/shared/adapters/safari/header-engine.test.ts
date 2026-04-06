import { afterEach, describe, expect, it, vi } from "vitest";

import { SafariHeaderEngine } from "./header-engine";

const globals = globalThis as typeof globalThis & {
  browser?: unknown;
  chrome?: unknown;
};

afterEach(() => {
  delete globals.browser;
  delete globals.chrome;
});

describe("SafariHeaderEngine", () => {
  it("browserがあればchromeより優先してdynamic ruleを更新する", async () => {
    const browserGetDynamicRules = vi.fn().mockResolvedValue([{ id: 1 }]);
    const browserUpdateDynamicRules = vi.fn().mockResolvedValue(undefined);
    const chromeUpdateDynamicRules = vi.fn().mockResolvedValue(undefined);

    globals.browser = {
      declarativeNetRequest: {
        getDynamicRules: browserGetDynamicRules,
        updateDynamicRules: browserUpdateDynamicRules,
      },
    };
    globals.chrome = {
      declarativeNetRequest: {
        getDynamicRules: vi.fn().mockResolvedValue([{ id: 2 }]),
        updateDynamicRules: chromeUpdateDynamicRules,
      },
    };

    const engine = new SafariHeaderEngine();

    await engine.applyRules([
      {
        id: 1,
        enabled: true,
        includePatterns: [],
        excludePatterns: [],
        resourceTypes: ["main_frame"],
        requestHeaders: [{ header: "X-Test", operation: "set", value: "1" }],
      },
    ]);

    expect(browserUpdateDynamicRules).toHaveBeenCalledTimes(1);
    expect(browserGetDynamicRules).toHaveBeenCalledTimes(1);
    expect(browserUpdateDynamicRules).toHaveBeenCalledWith({
      removeRuleIds: [1],
      addRules: [
        {
          id: 1,
          priority: 1,
          action: {
            type: "modifyHeaders",
            requestHeaders: [{ header: "X-Test", operation: "set", value: "1" }],
          },
          condition: {
            resourceTypes: ["main_frame"],
            urlFilter: "|http*",
          },
        },
      ],
    });
    expect(chromeUpdateDynamicRules).not.toHaveBeenCalled();
  });

  it("updateDynamicRulesが失敗した場合はログを出してそのまま投げる", async () => {
    const error = new Error("update failed");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    globals.browser = {
      declarativeNetRequest: {
        getDynamicRules: vi.fn().mockResolvedValue([]),
        updateDynamicRules: vi.fn().mockRejectedValue(error),
      },
    };

    const engine = new SafariHeaderEngine();

    await expect(
      engine.applyRules([
        {
          id: 1,
          enabled: true,
          includePatterns: [],
          excludePatterns: [],
          resourceTypes: ["main_frame"],
          requestHeaders: [{ header: "X-Test", operation: "set", value: "1" }],
        },
      ]),
    ).rejects.toThrow("update failed");

    expect(consoleError).toHaveBeenCalledWith("[header-injector/safari] applyRules:failed", error);

    consoleError.mockRestore();
  });

  it("APIが存在しない場合は明示エラーを投げる", () => {
    expect(() => new SafariHeaderEngine()).toThrowError("Safari-compatible declarativeNetRequest API is not available");
  });
});
