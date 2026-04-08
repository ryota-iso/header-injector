import { describe, expect, it, vi } from "vitest";

vi.mock("./ui/options-view", () => ({
  OptionsView: () => null,
}));

import { createSettingsRepository, resolveBrowserTarget } from "./App";

describe("resolveBrowserTarget", () => {
  it("browserがある場合はSafari系を選ぶ", () => {
    expect(resolveBrowserTarget({ browser: {}, chrome: {} })).toBe("safari");
  });

  it("browserが無い場合はChrome系を選ぶ", () => {
    expect(resolveBrowserTarget({ chrome: {} })).toBe("chrome");
  });
});

describe("createSettingsRepository", () => {
  it("browserがある場合はSafari repository factoryを使う", () => {
    const safariRepository = {
      load: vi.fn(),
      save: vi.fn(),
      subscribe: vi.fn(),
    };
    const safari = vi.fn(() => safariRepository);
    const chrome = vi.fn();

    const repository = createSettingsRepository(
      { browser: {}, chrome: {} },
      {
        safari,
        chrome,
      },
    );

    expect(repository).toBe(safariRepository);
    expect(safari).toHaveBeenCalledTimes(1);
    expect(chrome).not.toHaveBeenCalled();
  });

  it("browserが無い場合はChrome repository factoryを使う", () => {
    const chromeRepository = {
      load: vi.fn(),
      save: vi.fn(),
      subscribe: vi.fn(),
    };
    const safari = vi.fn();
    const chrome = vi.fn(() => chromeRepository);

    const repository = createSettingsRepository(
      { chrome: {} },
      {
        safari,
        chrome,
      },
    );

    expect(repository).toBe(chromeRepository);
    expect(chrome).toHaveBeenCalledTimes(1);
    expect(safari).not.toHaveBeenCalled();
  });
});
