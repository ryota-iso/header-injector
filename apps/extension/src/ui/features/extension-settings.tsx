/** @jsxImportSource solid-js */

import { type ExtensionSettings, createDefaultSettings, isValidMatchPattern, validateSettings } from "../../core";
import { Show, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { createStore, reconcile } from "solid-js/store";

import { RequestHeaders } from "./request-headers/request-headers";
import { UrlPatterns } from "./url-patterns/url-patterns";

export interface SettingsRepository {
  load(): Promise<ExtensionSettings>;
  save(settings: ExtensionSettings): Promise<void>;
  subscribe(listener: (settings: ExtensionSettings) => void): () => void;
}

export interface ExtensionSettingsProps {
  repo: SettingsRepository;
}

function cloneSettings(settings: ExtensionSettings): ExtensionSettings {
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

export function ExtensionSettingsView(props: ExtensionSettingsProps) {
  const [settings, setSettings] = createStore<ExtensionSettings>(createDefaultSettings());
  const [isLoaded, setIsLoaded] = createSignal(false);
  const [loadError, setLoadError] = createSignal<string | null>(null);

  onMount(() => {
    let unsubscribe = () => {};

    void props.repo
      .load()
      .then((loaded) => {
        setSettings(reconcile(cloneSettings(loaded)));
        setIsLoaded(true);
        setLoadError(null);
        unsubscribe = props.repo.subscribe((next) => {
          setSettings(reconcile(cloneSettings(next)));
        });
      })
      .catch(() => {
        setLoadError("Failed to load settings");
      });

    onCleanup(() => unsubscribe());
  });

  function persist() {
    if (!isLoaded()) {
      return;
    }
    void props.repo.save({ ...cloneSettings(settings), enabled: true });
  }

  function setHeaders(headers: ExtensionSettings["headers"]) {
    setSettings("headers", headers);
    persist();
  }

  function setIncludePatterns(patterns: string[]) {
    setSettings("target", "includePatterns", patterns);
    persist();
  }

  function setExcludePatterns(patterns: string[]) {
    setSettings("target", "excludePatterns", patterns);
    persist();
  }

  const validationIssues = createMemo(() => (isLoaded() ? validateSettings(settings) : []));

  const errorsByHeaderId = createMemo(() => {
    const map = new Map<string, string>();
    for (const issue of validationIssues()) {
      if (issue.type === "empty-header-name") {
        map.set(issue.entryId, "Header name is required");
      } else if (issue.type === "invalid-header-name") {
        map.set(issue.entryId, `"${issue.name}" contains invalid characters for an HTTP header name`);
      } else if (issue.type === "duplicate-header") {
        map.set(issue.entryId, `"${issue.name}" is duplicated`);
      }
    }
    return map;
  });

  const includeErrors = createMemo(() =>
    settings.target.includePatterns.map((pattern) => {
      if (pattern.trim() === "") {
        return undefined;
      }
      return isValidMatchPattern(pattern) ? undefined : "Invalid URL pattern";
    }),
  );

  const excludeErrors = createMemo(() =>
    settings.target.excludePatterns.map((pattern) => {
      if (pattern.trim() === "") {
        return undefined;
      }
      return isValidMatchPattern(pattern) ? undefined : "Invalid URL pattern";
    }),
  );

  return (
    <main class="bg-white">
      <div class="flex flex-col gap-6 px-5 py-5">
        <Show when={loadError()}>
          {(message) => (
            <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {message()}
            </div>
          )}
        </Show>

        <Show when={!isLoaded() && !loadError()}>
          <div class="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">Loading settings...</div>
        </Show>

        <Show when={isLoaded()}>
          <RequestHeaders errorsByHeaderId={errorsByHeaderId()} headers={settings.headers} setHeaders={setHeaders} />

          <UrlPatterns
            excludeErrors={excludeErrors()}
            excludePatterns={settings.target.excludePatterns}
            includeErrors={includeErrors()}
            includePatterns={settings.target.includePatterns}
            setExcludePatterns={setExcludePatterns}
            setIncludePatterns={setIncludePatterns}
          />
        </Show>
      </div>
    </main>
  );
}
