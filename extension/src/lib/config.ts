import type { ExtensionSettings, HeaderEntry, ResourceType } from "./types";

export const SETTINGS_VERSION = 1;
export const SETTINGS_STORAGE_KEY = "extension-settings";

export const DEFAULT_RESOURCE_TYPES: ResourceType[] = [
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
];

export function createDefaultHeaderEntry(id: string): HeaderEntry {
  return {
    id,
    name: "",
    value: "",
    enabled: true,
  };
}

export function createDefaultSettings(): ExtensionSettings {
  return {
    version: SETTINGS_VERSION,
    enabled: false,
    target: {
      includePatterns: [],
      excludePatterns: [],
      resourceTypes: [...DEFAULT_RESOURCE_TYPES],
    },
    headers: [createDefaultHeaderEntry("header-1")],
  };
}
