import type { ExtensionSettings, ResourceType } from "./types";

export interface HeaderMutationRule {
  id: number;
  enabled: boolean;
  includePatterns: string[];
  excludePatterns: string[];
  resourceTypes: ResourceType[];
  requestHeaders: Array<{
    header: string;
    operation: "set";
    value: string;
  }>;
}

interface IndexedHeaderMutation {
  index: number;
  header: string;
  operation: "set";
  value: string;
}

function normalizeHeaderName(name: string): string {
  return name.trim().toLowerCase();
}

export function compileSettingsToRules(settings: ExtensionSettings): HeaderMutationRule[] {
  if (!settings.enabled) {
    return [];
  }

  if (settings.target.resourceTypes.length === 0) {
    return [];
  }

  const requestHeadersByName = new Map<string, IndexedHeaderMutation>();

  for (const [index, header] of settings.headers.entries()) {
    if (!header.enabled) {
      continue;
    }

    const trimmedName = header.name.trim();
    if (trimmedName === "") {
      continue;
    }

    requestHeadersByName.set(normalizeHeaderName(trimmedName), {
      index,
      header: trimmedName,
      operation: "set",
      value: header.value,
    });
  }

  const requestHeaders = [...requestHeadersByName.values()]
    .sort((left, right) => left.index - right.index)
    .map(({ index: _index, ...requestHeader }) => requestHeader);

  if (requestHeaders.length === 0) {
    return [];
  }

  return [
    {
      id: 1,
      enabled: true,
      includePatterns: settings.target.includePatterns.map((pattern) => pattern.trim()).filter(Boolean),
      excludePatterns: settings.target.excludePatterns.map((pattern) => pattern.trim()).filter(Boolean),
      resourceTypes: [...settings.target.resourceTypes],
      requestHeaders,
    },
  ];
}
