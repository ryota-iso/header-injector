import { describe, expect, it } from "vitest";

import type { ExtensionSettings } from "./types";
import { compileSettingsToRules } from "./rules";

function createSettings(overrides?: Partial<ExtensionSettings>): ExtensionSettings {
  return {
    version: 1,
    enabled: true,
    target: {
      includePatterns: [],
      excludePatterns: [],
      resourceTypes: ["main_frame", "xmlhttprequest"],
      ...overrides?.target,
    },
    headers: overrides?.headers ?? [],
  };
}

describe("compileSettingsToRules", () => {
  it("extensionが無効なときはruleを返さない", () => {
    expect(compileSettingsToRules(createSettings({ enabled: false }))).toEqual([]);
  });

  it("resource typesが空のときはruleを返さない", () => {
    expect(
      compileSettingsToRules(
        createSettings({
          target: {
            includePatterns: ["https://example.com/*"],
            excludePatterns: [],
            resourceTypes: [],
          },
          headers: [{ id: "header-1", name: "X-Test", value: "1", enabled: true }],
        }),
      ),
    ).toEqual([]);
  });

  it("disabledまたは空名のheaderを除外しpatternをtrimする", () => {
    expect(
      compileSettingsToRules(
        createSettings({
          target: {
            includePatterns: [" https://example.com/* ", "   "],
            excludePatterns: [" *://example.com/private/* ", ""],
            resourceTypes: ["main_frame"],
          },
          headers: [
            { id: "empty", name: " ", value: "ignored", enabled: true },
            { id: "disabled", name: "X-Disabled", value: "ignored", enabled: false },
            { id: "enabled", name: " X-Test ", value: "value", enabled: true },
          ],
        }),
      ),
    ).toEqual([
      {
        id: 1,
        enabled: true,
        includePatterns: ["https://example.com/*"],
        excludePatterns: ["*://example.com/private/*"],
        resourceTypes: ["main_frame"],
        requestHeaders: [{ header: "X-Test", operation: "set", value: "value" }],
      },
    ]);
  });

  it("重複headerは最後のものだけを残し最後に現れた順で並べる", () => {
    expect(
      compileSettingsToRules(
        createSettings({
          headers: [
            { id: "first-auth", name: "Authorization", value: "first", enabled: true },
            { id: "trace", name: "X-Trace", value: "trace", enabled: true },
            { id: "last-auth", name: " authorization ", value: "last", enabled: true },
          ],
        }),
      ),
    ).toEqual([
      {
        id: 1,
        enabled: true,
        includePatterns: [],
        excludePatterns: [],
        resourceTypes: ["main_frame", "xmlhttprequest"],
        requestHeaders: [
          { header: "X-Trace", operation: "set", value: "trace" },
          { header: "authorization", operation: "set", value: "last" },
        ],
      },
    ]);
  });

  it("有効なheaderが残らないときはruleを返さない", () => {
    expect(
      compileSettingsToRules(
        createSettings({
          headers: [
            { id: "empty", name: " ", value: "", enabled: true },
            { id: "disabled", name: "X-Test", value: "1", enabled: false },
          ],
        }),
      ),
    ).toEqual([]);
  });

  it("不正文字を含むheaderはcompile時にスキップする", () => {
    expect(
      compileSettingsToRules(
        createSettings({
          headers: [
            { id: "space", name: "X Test", value: "ignored", enabled: true },
            { id: "colon", name: "Content-Type:", value: "ignored", enabled: true },
            { id: "valid", name: "X-Test", value: "kept", enabled: true },
          ],
        }),
      ),
    ).toEqual([
      {
        id: 1,
        enabled: true,
        includePatterns: [],
        excludePatterns: [],
        resourceTypes: ["main_frame", "xmlhttprequest"],
        requestHeaders: [{ header: "X-Test", operation: "set", value: "kept" }],
      },
    ]);
  });

  it("tchar外の文字のみで構成された場合はruleを返さない", () => {
    expect(
      compileSettingsToRules(
        createSettings({
          headers: [
            { id: "space", name: "X Test", value: "1", enabled: true },
            { id: "multibyte", name: "X-日本語", value: "2", enabled: true },
          ],
        }),
      ),
    ).toEqual([]);
  });
});
