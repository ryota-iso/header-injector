import { describe, expect, it } from "vitest";

import {
  DEFAULT_RESOURCE_TYPES,
  SETTINGS_STORAGE_KEY,
  SETTINGS_VERSION,
  createDefaultHeaderEntry,
  createDefaultSettings,
} from "./config";

describe("config", () => {
  it("createDefaultHeaderEntryは指定したidを持つ有効な空のヘッダーを返す", () => {
    expect(createDefaultHeaderEntry("custom-id")).toEqual({
      id: "custom-id",
      name: "",
      value: "",
      enabled: true,
    });
  });

  it("createDefaultSettingsは安全寄りの初期設定を返す", () => {
    expect(createDefaultSettings()).toEqual({
      version: SETTINGS_VERSION,
      enabled: false,
      target: {
        includePatterns: [],
        excludePatterns: [],
        resourceTypes: [...DEFAULT_RESOURCE_TYPES],
      },
      headers: [
        {
          id: "header-1",
          name: "",
          value: "",
          enabled: true,
        },
      ],
    });
  });

  it("DEFAULT_RESOURCE_TYPESは対応するresource typeを宣言順で全て含む", () => {
    expect(DEFAULT_RESOURCE_TYPES).toEqual([
      "main_frame",
      "sub_frame",
      "xmlhttprequest",
      "script",
      "image",
      "font",
      "stylesheet",
      "media",
      "websocket",
      "other",
    ]);
  });

  it("固定のストレージ用メタデータを公開する", () => {
    expect(SETTINGS_VERSION).toBe(1);
    expect(SETTINGS_STORAGE_KEY).toBe("extension-settings");
  });
});
