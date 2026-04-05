import { describe, expect, it } from "vitest";

import type { ExtensionSettings } from "@header-injector/core";

import {
  appendHeader,
  appendPattern,
  createHeaderId,
  deleteHeader,
  deletePattern,
  isSettingsEqual,
  replaceHeader,
  replacePattern,
  replaceResourceType,
} from "./settings-helpers";

function createSettings(overrides?: Partial<ExtensionSettings>): ExtensionSettings {
  return {
    version: 1,
    enabled: false,
    ...overrides,
    target: {
      includePatterns: [],
      excludePatterns: [],
      resourceTypes: ["main_frame", "xmlhttprequest"],
      ...overrides?.target,
    },
    headers: overrides?.headers ?? [],
  };
}

describe("settings-helpers", () => {
  it("同じ設定内容を等価と判定する", () => {
    const settings = createSettings({
      headers: [{ id: "header-1", name: "X-Test", value: "1", enabled: true }],
    });

    expect(
      isSettingsEqual(settings, createSettings({ headers: [{ id: "header-1", name: "X-Test", value: "1", enabled: true }] })),
    ).toBe(true);
  });

  it("差分がある設定内容を非等価と判定する", () => {
    expect(isSettingsEqual(createSettings({ enabled: false }), createSettings({ enabled: true }))).toBe(false);
  });

  it("patternの追加更新削除を行える", () => {
    const appended = appendPattern(["https://example.com/*"]);
    const replaced = replacePattern(appended, 1, "*://example.com/private/*");
    const removed = deletePattern(replaced, 0);

    expect(appended).toEqual(["https://example.com/*", ""]);
    expect(replaced).toEqual(["https://example.com/*", "*://example.com/private/*"]);
    expect(removed).toEqual(["*://example.com/private/*"]);
  });

  it("headerの追加更新削除を行える", () => {
    const appended = appendHeader([], 1700000000000);
    const replaced = replaceHeader(appended, appended[0].id, { name: "X-Test", value: "1" });
    const removed = deleteHeader(replaced, replaced[0].id);

    expect(appended[0]).toEqual({
      id: appended[0].id,
      name: "",
      value: "",
      enabled: true,
    });
    expect(replaced).toEqual([{ ...appended[0], name: "X-Test", value: "1" }]);
    expect(removed).toEqual([]);
  });

  it("resource typeの追加と削除を宣言順で維持する", () => {
    expect(replaceResourceType(["xmlhttprequest"], "main_frame", true)).toEqual(["main_frame", "xmlhttprequest"]);
    expect(replaceResourceType(["main_frame", "xmlhttprequest"], "main_frame", false)).toEqual(["xmlhttprequest"]);
  });

  it("header idを日時と連番から生成する", () => {
    expect(createHeaderId(1700000000000)).toMatch(/^header-1700000000000-\d+$/);
  });
});
