import { describe, expect, it } from "vitest";

import type { ExtensionSettings } from "./types";
import { isValidHeaderName, isValidMatchPattern, validateSettings } from "./validation";

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

  it("非ASCII文字を含むpatternを拒否する", () => {
    expect(isValidMatchPattern("https://例.com/*")).toBe(false);
    expect(isValidMatchPattern("https://example.com/日本語")).toBe(false);
    expect(isValidMatchPattern("https://example.com/path?q=テスト")).toBe(false);
  });
});

describe("isValidHeaderName", () => {
  it("RFC 7230 tcharで構成されたheader名を受け入れる", () => {
    expect(isValidHeaderName("X-Test")).toBe(true);
    expect(isValidHeaderName("Content-Type")).toBe(true);
    expect(isValidHeaderName("authorization")).toBe(true);
    expect(isValidHeaderName("!#$%&'*+-.^_`|~0123")).toBe(true);
    expect(isValidHeaderName("  X-Trim  ")).toBe(true);
  });

  it("空文字またはtchar外の文字を含むheader名を拒否する", () => {
    expect(isValidHeaderName("")).toBe(false);
    expect(isValidHeaderName("   ")).toBe(false);
    expect(isValidHeaderName("X Test")).toBe(false);
    expect(isValidHeaderName("Content-Type:")).toBe(false);
    expect(isValidHeaderName('X-"Quoted"')).toBe(false);
    expect(isValidHeaderName("X-日本語")).toBe(false);
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

  it("不正文字を含むheader名に対してinvalid-header-nameを返す", () => {
    const settings = createSettings({
      headers: [
        { id: "space", name: "X Test", value: "1", enabled: true },
        { id: "colon", name: "Content-Type:", value: "2", enabled: true },
        { id: "multibyte", name: "X-日本語", value: "3", enabled: true },
      ],
    });

    expect(validateSettings(settings)).toEqual([
      { type: "invalid-header-name", entryId: "space", name: "X Test" },
      { type: "invalid-header-name", entryId: "colon", name: "Content-Type:" },
      { type: "invalid-header-name", entryId: "multibyte", name: "X-日本語" },
    ]);
  });

  it("不正文字のheader名は重複判定の対象から除外する", () => {
    const settings = createSettings({
      headers: [
        { id: "invalid", name: "X Test", value: "1", enabled: true },
        { id: "valid", name: "X-Test", value: "2", enabled: true },
      ],
    });

    expect(validateSettings(settings)).toEqual([{ type: "invalid-header-name", entryId: "invalid", name: "X Test" }]);
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
