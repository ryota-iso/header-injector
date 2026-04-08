/** @jsxImportSource solid-js */

import { ChromeSettingsRepository } from "../platforms/chrome";
import { SafariSettingsRepository } from "../platforms/safari";
import { ExtensionSettingsView, type SettingsRepository } from "./features/extension-settings";

interface BrowserGlobals {
  browser?: unknown;
  chrome?: unknown;
}

interface RepositoryFactories {
  chrome: () => SettingsRepository;
  safari: () => SettingsRepository;
}

const defaultRepositoryFactories: RepositoryFactories = {
  chrome: () => new ChromeSettingsRepository(),
  safari: () => new SafariSettingsRepository(),
};

export function resolveBrowserTarget(globals: BrowserGlobals = globalThis as BrowserGlobals): "chrome" | "safari" {
  return globals.browser ? "safari" : "chrome";
}

export function createSettingsRepository(
  globals: BrowserGlobals = globalThis as BrowserGlobals,
  factories: RepositoryFactories = defaultRepositoryFactories,
): SettingsRepository {
  return resolveBrowserTarget(globals) === "safari" ? factories.safari() : factories.chrome();
}

export function App() {
  return <ExtensionSettingsView repo={createSettingsRepository()} />;
}
