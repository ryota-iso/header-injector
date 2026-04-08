import { createDynamicRules, type DynamicRule, type HeaderEngine } from "../../ports/header-engine";
import type { HeaderMutationRule } from "../../../lib";

interface DeclarativeNetRequestNamespace {
  getDynamicRules(): Promise<Array<{ id: number }>>;
  updateDynamicRules(update: { removeRuleIds: number[]; addRules: DynamicRule[] }): Promise<void>;
}

interface ChromeExtensionLike {
  declarativeNetRequest: DeclarativeNetRequestNamespace;
}

export class ChromeHeaderEngine implements HeaderEngine {
  readonly #api: DeclarativeNetRequestNamespace;

  constructor(extension = resolveChromeExtension()) {
    this.#api = extension.declarativeNetRequest;
  }

  async applyRules(rules: HeaderMutationRule[]): Promise<void> {
    const currentRules = await this.#api.getDynamicRules();
    await this.#api.updateDynamicRules({
      removeRuleIds: currentRules.map((rule) => rule.id),
      addRules: createDynamicRules(rules),
    });
  }
}

function resolveChromeExtension(): ChromeExtensionLike {
  const extension = (globalThis as typeof globalThis & { chrome?: ChromeExtensionLike }).chrome;

  if (!extension?.declarativeNetRequest) {
    throw new Error("Chrome declarativeNetRequest API is not available");
  }

  return extension;
}
