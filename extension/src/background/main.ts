import { compileSettingsToRules, type ExtensionSettings } from "../lib";

import { ChromeHeaderEngine } from "../shared/adapters/chrome/header-engine";
import { ChromeSettingsRepository } from "../shared/adapters/chrome/storage";
import { SafariHeaderEngine } from "../shared/adapters/safari/header-engine";
import { SafariSettingsRepository } from "../shared/adapters/safari/storage";
import type { HeaderEngine } from "../shared/ports/header-engine";

interface BackgroundRuntimeEvent {
  addListener(listener: () => void): void;
}

interface BackgroundRuntime {
  onInstalled: BackgroundRuntimeEvent;
  onStartup?: BackgroundRuntimeEvent;
}

interface BackgroundRepository {
  load(): Promise<ExtensionSettings>;
  subscribe(listener: (settings: ExtensionSettings) => void): () => void;
}

interface BrowserGlobals {
  browser?: { runtime?: BackgroundRuntime };
  chrome?: { runtime?: BackgroundRuntime };
}

interface BackgroundFactories {
  chrome: {
    createRepository: () => BackgroundRepository;
    createHeaderEngine: () => HeaderEngine;
  };
  safari: {
    createRepository: () => BackgroundRepository;
    createHeaderEngine: () => HeaderEngine;
  };
}

const defaultBackgroundFactories: BackgroundFactories = {
  chrome: {
    createRepository: () => new ChromeSettingsRepository(),
    createHeaderEngine: () => new ChromeHeaderEngine(),
  },
  safari: {
    createRepository: () => new SafariSettingsRepository(),
    createHeaderEngine: () => new SafariHeaderEngine(),
  },
};

export async function syncRules(repository: Pick<BackgroundRepository, "load">, headerEngine: HeaderEngine): Promise<void> {
  const settings = await repository.load();
  const rules = compileSettingsToRules(settings);
  await headerEngine.applyRules(rules);
}

export function resolveBackgroundTarget(globals: BrowserGlobals = globalThis as BrowserGlobals): "chrome" | "safari" | null {
  if (globals.browser?.runtime) {
    return "safari";
  }

  if (globals.chrome?.runtime) {
    return "chrome";
  }

  return null;
}

export function registerBackgroundListeners(
  runtime: BackgroundRuntime,
  repository: BackgroundRepository,
  synchronize: () => Promise<void>,
): () => void {
  const runSafely = () => {
    void synchronize().catch((error: unknown) => {
      console.error("Failed to sync extension rules", error);
    });
  };

  runtime.onInstalled.addListener(runSafely);
  runtime.onStartup?.addListener(runSafely);

  return repository.subscribe(() => {
    runSafely();
  });
}

export function startBackground(
  globals: BrowserGlobals = globalThis as BrowserGlobals,
  factories: BackgroundFactories = defaultBackgroundFactories,
): (() => void) | null {
  const target = resolveBackgroundTarget(globals);
  if (!target) {
    return null;
  }

  const runtime = target === "safari" ? globals.browser?.runtime : globals.chrome?.runtime;
  if (!runtime) {
    return null;
  }

  const repository = target === "safari" ? factories.safari.createRepository() : factories.chrome.createRepository();
  const headerEngine = target === "safari" ? factories.safari.createHeaderEngine() : factories.chrome.createHeaderEngine();

  const synchronize = async () => {
    await syncRules(repository, headerEngine);
  };
  synchronize().catch((error: unknown) => {
    console.error("Failed to sync extension rules", error);
  });

  return registerBackgroundListeners(runtime, repository, synchronize);
}

void startBackground();
