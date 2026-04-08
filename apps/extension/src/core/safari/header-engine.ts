import { createDynamicRules, type DynamicRule } from "../dnr-rules";
import type { HeaderEngine } from "../interfaces";
import type { HeaderMutationRule } from "../rules";

interface DeclarativeNetRequestNamespace {
  getDynamicRules(): Promise<Array<{ id: number }>>;
  updateDynamicRules(update: { removeRuleIds: number[]; addRules: DynamicRule[] }): Promise<void>;
}

interface BrowserExtensionLike {
  declarativeNetRequest: DeclarativeNetRequestNamespace;
}

export class SafariHeaderEngine implements HeaderEngine {
  readonly #api: DeclarativeNetRequestNamespace;

  constructor(extension = resolveSafariExtension()) {
    this.#api = extension.declarativeNetRequest;
  }

  async applyRules(rules: HeaderMutationRule[]): Promise<void> {
    const nextRules = createDynamicRules(rules);

    try {
      const currentRules = await this.#api.getDynamicRules();

      await this.#api.updateDynamicRules({
        removeRuleIds: currentRules.map((rule) => rule.id),
        addRules: nextRules,
      });
    } catch (error) {
      console.error("[header-injector/safari] applyRules:failed", error);
      throw error;
    }
  }
}

function resolveSafariExtension(): BrowserExtensionLike {
  const globals = globalThis as typeof globalThis & {
    browser?: BrowserExtensionLike;
    chrome?: BrowserExtensionLike;
  };

  const extension = globals.browser ?? globals.chrome;
  if (!extension?.declarativeNetRequest) {
    throw new Error("Safari-compatible declarativeNetRequest API is not available");
  }

  return extension;
}
