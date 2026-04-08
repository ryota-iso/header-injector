import type { HeaderMutationRule, ResourceType } from "../../lib";

export interface HeaderEngine {
  applyRules(rules: HeaderMutationRule[]): Promise<void>;
}

export interface DynamicRuleCondition {
  resourceTypes: ResourceType[];
  regexFilter?: string;
  urlFilter?: string;
}

export interface DynamicRule {
  id: number;
  priority: number;
  action:
    | { type: "allow" }
    | {
        type: "modifyHeaders";
        requestHeaders: HeaderMutationRule["requestHeaders"];
      };
  condition: DynamicRuleCondition;
}

const CATCH_ALL_URL_FILTER = "|http*";
const REGEXP_RESERVED = /[.*+?^${}()|[\]\\]/g;

export function createDynamicRules(rules: HeaderMutationRule[]): DynamicRule[] {
  const dynamicRules: DynamicRule[] = [];
  let nextRuleId = 1;

  for (const rule of rules) {
    if (!rule.enabled || rule.requestHeaders.length === 0 || rule.resourceTypes.length === 0) {
      continue;
    }

    for (const condition of createExcludeConditions(rule.excludePatterns, rule.resourceTypes)) {
      dynamicRules.push({
        id: nextRuleId,
        priority: 2,
        action: { type: "allow" },
        condition,
      });
      nextRuleId += 1;
    }

    for (const condition of createIncludeConditions(rule.includePatterns, rule.resourceTypes)) {
      dynamicRules.push({
        id: nextRuleId,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: rule.requestHeaders.map((header) => ({ ...header })),
        },
        condition,
      });
      nextRuleId += 1;
    }
  }

  return dynamicRules;
}

export function matchPatternToDnrCondition(pattern: string, resourceTypes: ResourceType[]): DynamicRuleCondition {
  const trimmed = pattern.trim();
  if (trimmed === "<all_urls>") {
    return {
      resourceTypes: [...resourceTypes],
      urlFilter: CATCH_ALL_URL_FILTER,
    };
  }

  const separatorIndex = trimmed.indexOf("://");
  const scheme = trimmed.slice(0, separatorIndex);
  const remainder = trimmed.slice(separatorIndex + 3);
  const slashIndex = remainder.indexOf("/");
  const host = remainder.slice(0, slashIndex);
  const path = remainder.slice(slashIndex);

  return {
    resourceTypes: [...resourceTypes],
    regexFilter: `^${toSchemePattern(scheme)}://${toHostPattern(host)}${toPathPattern(path)}$`,
  };
}

function createIncludeConditions(patterns: readonly string[], resourceTypes: ResourceType[]): DynamicRuleCondition[] {
  const sanitizedPatterns = sanitizePatterns(patterns);
  if (sanitizedPatterns.length === 0 || sanitizedPatterns.includes("<all_urls>")) {
    return [{ resourceTypes: [...resourceTypes], urlFilter: CATCH_ALL_URL_FILTER }];
  }

  return sanitizedPatterns.map((pattern) => matchPatternToDnrCondition(pattern, resourceTypes));
}

function createExcludeConditions(patterns: readonly string[], resourceTypes: ResourceType[]): DynamicRuleCondition[] {
  const sanitizedPatterns = sanitizePatterns(patterns);
  if (sanitizedPatterns.length === 0) {
    return [];
  }

  if (sanitizedPatterns.includes("<all_urls>")) {
    return [{ resourceTypes: [...resourceTypes], urlFilter: CATCH_ALL_URL_FILTER }];
  }

  return sanitizedPatterns.map((pattern) => matchPatternToDnrCondition(pattern, resourceTypes));
}

function sanitizePatterns(patterns: readonly string[]): string[] {
  return patterns.map((pattern) => pattern.trim()).filter(Boolean);
}

function escapeRegexp(value: string): string {
  return value.replace(REGEXP_RESERVED, String.raw`\$&`);
}

function toSchemePattern(scheme: string): string {
  return scheme === "*" ? "https?" : escapeRegexp(scheme);
}

function toHostPattern(host: string): string {
  if (host === "*") {
    return "[^/]+";
  }

  if (host.startsWith("*.")) {
    return `(?:[^/]+\\.)*${escapeRegexp(host.slice(2))}`;
  }

  return escapeRegexp(host);
}

function toPathPattern(pathname: string): string {
  let output = "";

  for (const character of pathname) {
    output += character === "*" ? ".*" : escapeRegexp(character);
  }

  return output;
}
