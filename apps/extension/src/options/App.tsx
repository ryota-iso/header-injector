/** @jsxImportSource solid-js */

import type { ExtensionSettings } from "../core";

import { ChromeSettingsRepository } from "../platforms/chrome";
import { SafariSettingsRepository } from "../platforms/safari";
import { OptionsView } from "./view";

interface SettingsRepositoryLike {
  load(): Promise<ExtensionSettings>;
  save(settings: ExtensionSettings): Promise<void>;
  subscribe(listener: (settings: ExtensionSettings) => void): () => void;
}

interface BrowserGlobals {
  browser?: unknown;
  chrome?: unknown;
}

interface RepositoryFactories {
  chrome: () => SettingsRepositoryLike;
  safari: () => SettingsRepositoryLike;
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
): SettingsRepositoryLike {
  return resolveBrowserTarget(globals) === "safari" ? factories.safari() : factories.chrome();
}

export function App() {
  return <OptionsView repo={createSettingsRepository()} />;
}
