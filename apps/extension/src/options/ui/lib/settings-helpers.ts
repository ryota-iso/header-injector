import {
  DEFAULT_RESOURCE_TYPES,
  createDefaultHeaderEntry,
  type ExtensionSettings,
  type HeaderEntry,
  type ResourceType,
  isValidMatchPattern,
} from "../../../core";

let headerIdCounter = 0;

export function createHeaderId(now = Date.now()): string {
  headerIdCounter += 1;
  return `header-${now}-${headerIdCounter}`;
}

export function cloneSettings(settings: ExtensionSettings): ExtensionSettings {
  return {
    version: settings.version,
    enabled: settings.enabled,
    target: {
      includePatterns: [...settings.target.includePatterns],
      excludePatterns: [...settings.target.excludePatterns],
      resourceTypes: [...settings.target.resourceTypes],
    },
    headers: settings.headers.map((header) => ({ ...header })),
  };
}

export function isSettingsEqual(left: ExtensionSettings, right: ExtensionSettings): boolean {
  if (left.version !== right.version || left.enabled !== right.enabled) {
    return false;
  }

  if (!isStringArrayEqual(left.target.includePatterns, right.target.includePatterns)) {
    return false;
  }

  if (!isStringArrayEqual(left.target.excludePatterns, right.target.excludePatterns)) {
    return false;
  }

  if (!isStringArrayEqual(left.target.resourceTypes, right.target.resourceTypes)) {
    return false;
  }

  if (left.headers.length !== right.headers.length) {
    return false;
  }

  return left.headers.every((header, index) => isHeaderEqual(header, right.headers[index]));
}

export function canToggleEnabledImmediately(hasUnsavedChanges: boolean): boolean {
  return !hasUnsavedChanges;
}

export function createEnabledSettings(settings: ExtensionSettings, enabled: boolean): ExtensionSettings {
  return {
    ...cloneSettings(settings),
    enabled,
  };
}

export function appendPattern(patterns: readonly string[]): string[] {
  return [...patterns, ""];
}

export function replacePattern(patterns: readonly string[], index: number, value: string): string[] {
  return patterns.map((pattern, patternIndex) => (patternIndex === index ? value : pattern));
}

export function getPatternValidationStates(patterns: readonly string[]): boolean[] {
  return patterns.map((pattern) => isValidMatchPattern(pattern));
}

export function deletePattern(patterns: readonly string[], index: number): string[] {
  return patterns.filter((_pattern, patternIndex) => patternIndex !== index);
}

export function appendHeader(headers: readonly HeaderEntry[], now?: number): HeaderEntry[] {
  return [...headers, createDefaultHeaderEntry(createHeaderId(now))];
}

export function replaceHeader(headers: readonly HeaderEntry[], entryId: string, patch: Partial<HeaderEntry>): HeaderEntry[] {
  return headers.map((header) => (header.id === entryId ? { ...header, ...patch } : header));
}

export function deleteHeader(headers: readonly HeaderEntry[], entryId: string): HeaderEntry[] {
  return headers.filter((header) => header.id !== entryId);
}

export function replaceResourceType(
  resourceTypes: readonly ResourceType[],
  resourceType: ResourceType,
  checked: boolean,
): ResourceType[] {
  const next = checked
    ? [...resourceTypes.filter((item) => item !== resourceType), resourceType]
    : resourceTypes.filter((item) => item !== resourceType);

  return DEFAULT_RESOURCE_TYPES.filter((item) => next.includes(item));
}

function isHeaderEqual(left: HeaderEntry, right: HeaderEntry): boolean {
  return left.id === right.id && left.name === right.name && left.value === right.value && left.enabled === right.enabled;
}

function isStringArrayEqual(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((item, index) => item === right[index]);
}
