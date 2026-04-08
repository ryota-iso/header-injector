export type ResourceType =
  | "main_frame"
  | "sub_frame"
  | "xmlhttprequest"
  | "script"
  | "image"
  | "font"
  | "stylesheet"
  | "media"
  | "websocket"
  | "other";

export interface HeaderEntry {
  id: string;
  name: string;
  value: string;
  enabled: boolean;
}

export interface MatchTarget {
  includePatterns: string[];
  excludePatterns: string[];
  resourceTypes: ResourceType[];
}

export interface ExtensionSettings {
  version: 1;
  enabled: boolean;
  target: MatchTarget;
  headers: HeaderEntry[];
}
