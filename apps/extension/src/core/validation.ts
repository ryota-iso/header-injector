import type { ExtensionSettings } from "./types";

export type ValidationIssue =
  | { type: "empty-header-name"; entryId: string }
  | { type: "invalid-header-name"; entryId: string; name: string }
  | { type: "duplicate-header"; entryId: string; name: string }
  | { type: "invalid-pattern"; field: "includePatterns" | "excludePatterns"; pattern: string };

const MATCH_PATTERN_REGEXP = /^(https?|\*):\/\/[^/\s]+\/[^\s]*$/;
const ASCII_PRINTABLE_REGEXP = /^[\x21-\x7E]+$/;
const HEADER_NAME_REGEXP = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

export function isValidMatchPattern(pattern: string): boolean {
  const trimmed = pattern.trim();
  if (trimmed === "") {
    return false;
  }

  if (trimmed === "<all_urls>") {
    return true;
  }

  if (!ASCII_PRINTABLE_REGEXP.test(trimmed)) {
    return false;
  }

  return MATCH_PATTERN_REGEXP.test(trimmed);
}

export function isValidHeaderName(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed === "") {
    return false;
  }

  return HEADER_NAME_REGEXP.test(trimmed);
}

export function validateSettings(settings: ExtensionSettings): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenHeaderNames = new Set<string>();

  for (const header of settings.headers) {
    if (!header.enabled) {
      continue;
    }

    const name = header.name.trim();
    if (name === "") {
      issues.push({ type: "empty-header-name", entryId: header.id });
      continue;
    }

    if (!isValidHeaderName(name)) {
      issues.push({ type: "invalid-header-name", entryId: header.id, name });
      continue;
    }

    const normalizedName = name.toLowerCase();
    if (seenHeaderNames.has(normalizedName)) {
      issues.push({ type: "duplicate-header", entryId: header.id, name });
      continue;
    }

    seenHeaderNames.add(normalizedName);
  }

  for (const pattern of settings.target.includePatterns) {
    if (!isValidMatchPattern(pattern)) {
      issues.push({ type: "invalid-pattern", field: "includePatterns", pattern });
    }
  }

  for (const pattern of settings.target.excludePatterns) {
    if (!isValidMatchPattern(pattern)) {
      issues.push({ type: "invalid-pattern", field: "excludePatterns", pattern });
    }
  }

  return issues;
}
