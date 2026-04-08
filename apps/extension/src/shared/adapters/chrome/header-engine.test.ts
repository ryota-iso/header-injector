import { afterEach, describe, expect, it, vi } from "vitest";

import { ChromeHeaderEngine } from "./header-engine";

const globals = globalThis as typeof globalThis & {
  chrome?: unknown;
};

afterEach(() => {
  delete globals.chrome;
});

describe("ChromeHeaderEngine", () => {
  it("既存dynamic ruleを全削除して再投入する", async () => {
    const updateDynamicRules = vi.fn().mockResolvedValue(undefined);

    globals.chrome = {
      declarativeNetRequest: {
        getDynamicRules: vi.fn().mockResolvedValue([{ id: 10 }, { id: 20 }]),
        updateDynamicRules,
      },
    };

    const engine = new ChromeHeaderEngine();

    await engine.applyRules([
      {
        id: 1,
        enabled: true,
        includePatterns: ["https://example.com/*"],
        excludePatterns: [],
        resourceTypes: ["xmlhttprequest"],
        requestHeaders: [{ header: "X-Test", operation: "set", value: "1" }],
      },
    ]);

    expect(updateDynamicRules).toHaveBeenCalledWith({
      removeRuleIds: [10, 20],
      addRules: [
        {
          id: 1,
          priority: 1,
          action: {
            type: "modifyHeaders",
            requestHeaders: [{ header: "X-Test", operation: "set", value: "1" }],
          },
          condition: {
            resourceTypes: ["xmlhttprequest"],
            regexFilter: "^https://example\\.com/.*$",
          },
        },
      ],
    });
  });

  it("APIが存在しない場合は明示エラーを投げる", () => {
    expect(() => new ChromeHeaderEngine()).toThrowError("Chrome declarativeNetRequest API is not available");
  });
});
