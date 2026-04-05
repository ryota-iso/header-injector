import { describe, expect, it } from "vitest";

import type { ExtensionSettings } from "./types";
import { validateSettings, isValidMatchPattern } from "./validation";

function createSettings(overrides?: Partial<ExtensionSettings>): ExtensionSettings {
  return {
    version: 1,
    enabled: false,
    target: {
      includePatterns: [],
      excludePatterns: [],
      resourceTypes: ["main_frame", "xmlhttprequest"],
      ...overrides?.target,
    },
    headers: overrides?.headers ?? [],
  };
}

describe("isValidMatchPattern", () => {
  it("対応しているmatch patternの最小サブセットを受け入れる", () => {
    expect(isValidMatchPattern("<all_urls>")).toBe(true);
    expect(isValidMatchPattern("http://example.com/*")).toBe(true);
    expect(isValidMatchPattern("https://example.com/api/*")).toBe(true);
    expect(isValidMatchPattern("*://example.com/*")).toBe(true);
  });

  it("無効なpatternを拒否する", () => {
    expect(isValidMatchPattern("")).toBe(false);
    expect(isValidMatchPattern("   ")).toBe(false);
    expect(isValidMatchPattern("http://example.com")).toBe(false);
    expect(isValidMatchPattern("ftp://example.com/*")).toBe(false);
    expect(isValidMatchPattern("https:///path")).toBe(false);
  });
});

describe("validateSettings", () => {
  it("有効なheaderに対してのみ空名エラーを返す", () => {
    const settings = createSettings({
      headers: [
        { id: "enabled-empty", name: " ", value: "", enabled: true },
        { id: "disabled-empty", name: " ", value: "", enabled: false },
      ],
    });

    expect(validateSettings(settings)).toEqual([{ type: "empty-header-name", entryId: "enabled-empty" }]);
  });

  it("header名の重複を大文字小文字を無視して検出しdisabled entryは除外する", () => {
    const settings = createSettings({
      headers: [
        { id: "first", name: "Authorization", value: "a", enabled: true },
        { id: "disabled-duplicate", name: " authorization ", value: "b", enabled: false },
        { id: "second", name: " authorization ", value: "c", enabled: true },
      ],
    });

    expect(validateSettings(settings)).toEqual([{ type: "duplicate-header", entryId: "second", name: "authorization" }]);
  });

  it("無効なinclude patternをexclude patternより先に返す", () => {
    const settings = createSettings({
      target: {
        includePatterns: ["https://example.com/*", "invalid-include"],
        excludePatterns: ["invalid-exclude", "*://example.com/private/*"],
        resourceTypes: ["main_frame"],
      },
    });

    expect(validateSettings(settings)).toEqual([
      { type: "invalid-pattern", field: "includePatterns", pattern: "invalid-include" },
      { type: "invalid-pattern", field: "excludePatterns", pattern: "invalid-exclude" },
    ]);
  });

  it("headerとpatternをまたいでもissueの順序を安定させる", () => {
    const settings = createSettings({
      headers: [
        { id: "first-empty", name: "", value: "", enabled: true },
        { id: "first", name: "X-Test", value: "", enabled: true },
        { id: "duplicate", name: " x-test ", value: "", enabled: true },
      ],
      target: {
        includePatterns: ["bad-include"],
        excludePatterns: ["bad-exclude"],
        resourceTypes: ["main_frame"],
      },
    });

    expect(validateSettings(settings)).toEqual([
      { type: "empty-header-name", entryId: "first-empty" },
      { type: "duplicate-header", entryId: "duplicate", name: "x-test" },
      { type: "invalid-pattern", field: "includePatterns", pattern: "bad-include" },
      { type: "invalid-pattern", field: "excludePatterns", pattern: "bad-exclude" },
    ]);
  });
});
