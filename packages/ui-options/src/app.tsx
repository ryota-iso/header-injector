/** @jsxImportSource solid-js */

import {
  DEFAULT_RESOURCE_TYPES,
  createDefaultHeaderEntry,
  type ExtensionSettings,
  type HeaderEntry,
  type ResourceType,
  validateSettings,
} from "@header-injector/core";
import { Show, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { reconcile } from "solid-js/store";
import { createStore } from "solid-js/store";

import { HeaderListEditor } from "./components/header-list-editor";
import { PatternListEditor } from "./components/pattern-list-editor";
import { ResourceTypeEditor } from "./components/resource-type-editor";
import { SettingsForm } from "./components/settings-form";
import { ValidationSummary } from "./components/validation-summary";
import { cloneSettings, createHeaderId, isSettingsEqual, replaceResourceType } from "./lib/settings-helpers";
import { toValidationMessage } from "./lib/validation-messages";

export interface SettingsRepository {
  load(): Promise<ExtensionSettings>;
  save(settings: ExtensionSettings): Promise<void>;
  subscribe(listener: (settings: ExtensionSettings) => void): () => void;
}

export interface AppProps {
  repo: SettingsRepository;
}

const panelStyle = {
  border: "1px solid #d1d5db",
  "border-radius": "12px",
  padding: "16px",
  "background-color": "#ffffff",
} as const;

const pageStyle = {
  margin: "0 auto",
  padding: "24px",
  "max-width": "960px",
  display: "grid",
  gap: "16px",
  color: "#111827",
  "font-family": '"Hiragino Sans", "Noto Sans JP", sans-serif',
  "background-color": "#f9fafb",
} as const;

const bannerBaseStyle = {
  padding: "12px 14px",
  "border-radius": "10px",
  "font-size": "14px",
} as const;

export function App(props: AppProps) {
  const [savedSettings, setSavedSettings] = createStore<ExtensionSettings>({
    version: 1,
    enabled: false,
    target: { includePatterns: [], excludePatterns: [], resourceTypes: [...DEFAULT_RESOURCE_TYPES] },
    headers: [createDefaultHeaderEntry("header-1")],
  });
  const [draftSettings, setDraftSettings] = createStore<ExtensionSettings>({
    version: 1,
    enabled: false,
    target: { includePatterns: [], excludePatterns: [], resourceTypes: [...DEFAULT_RESOURCE_TYPES] },
    headers: [createDefaultHeaderEntry("header-1")],
  });
  const [isLoaded, setIsLoaded] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);
  const [saveError, setSaveError] = createSignal<string | null>(null);
  const [saveSuccess, setSaveSuccess] = createSignal<string | null>(null);
  const [loadError, setLoadError] = createSignal<string | null>(null);
  const [pendingExternalSettings, setPendingExternalSettings] = createSignal<ExtensionSettings | null>(null);

  const validationIssues = createMemo(() => (isLoaded() ? validateSettings(draftSettings) : []));
  const dirty = createMemo(() => (isLoaded() ? !isSettingsEqual(savedSettings, draftSettings) : false));
  const canSave = createMemo(() => dirty() && validationIssues().length === 0 && !isSaving());
  const hasPendingExternalUpdate = createMemo(() => pendingExternalSettings() !== null);

  const headerIssueMessages = createMemo(() => {
    const messages = new Map<string, string[]>();

    for (const issue of validationIssues()) {
      if (issue.type === "empty-header-name" || issue.type === "duplicate-header") {
        const entryMessages = messages.get(issue.entryId) ?? [];
        entryMessages.push(toValidationMessage(issue));
        messages.set(issue.entryId, entryMessages);
      }
    }

    return messages;
  });

  function applySavedSettings(settings: ExtensionSettings) {
    setSavedSettings(reconcile(cloneSettings(settings)));
  }

  function applyDraftSettings(settings: ExtensionSettings) {
    setDraftSettings(reconcile(cloneSettings(settings)));
  }

  function handleExternalSettingsUpdate(nextSettings: ExtensionSettings) {
    setSaveSuccess(null);
    if (!dirty()) {
      applySavedSettings(nextSettings);
      applyDraftSettings(nextSettings);
      setPendingExternalSettings(null);
      return;
    }

    setPendingExternalSettings(cloneSettings(nextSettings));
  }

  onMount(() => {
    let unsubscribe = () => {};

    void props.repo
      .load()
      .then((settings) => {
        applySavedSettings(settings);
        applyDraftSettings(settings);
        setLoadError(null);
        setIsLoaded(true);
        unsubscribe = props.repo.subscribe((nextSettings) => {
          handleExternalSettingsUpdate(nextSettings);
        });
      })
      .catch(() => {
        setLoadError("設定の読み込みに失敗した");
      });

    onCleanup(() => {
      unsubscribe();
    });
  });

  async function handleSave() {
    if (!canSave()) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const nextSettings = cloneSettings(draftSettings);
      await props.repo.save(nextSettings);
      applySavedSettings(nextSettings);
      applyDraftSettings(nextSettings);
      setPendingExternalSettings(null);
      setSaveSuccess("設定を保存した");
    } catch {
      setSaveError("設定の保存に失敗した");
    } finally {
      setIsSaving(false);
    }
  }

  function handleReset() {
    applyDraftSettings(savedSettings);
    setSaveError(null);
    setSaveSuccess(null);
  }

  function reloadPendingExternalSettings() {
    const nextSettings = pendingExternalSettings();
    if (!nextSettings) {
      return;
    }

    applySavedSettings(nextSettings);
    applyDraftSettings(nextSettings);
    setPendingExternalSettings(null);
    setSaveError(null);
    setSaveSuccess(null);
  }

  function updateHeader(entryId: string, patch: Partial<HeaderEntry>) {
    const nextHeaders = draftSettings.headers.map((header) => (header.id === entryId ? { ...header, ...patch } : header));
    setDraftSettings("headers", nextHeaders);
    setSaveSuccess(null);
  }

  function addHeader() {
    setDraftSettings("headers", [...draftSettings.headers, createDefaultHeaderEntry(createHeaderId())]);
    setSaveSuccess(null);
  }

  function removeHeader(entryId: string) {
    setDraftSettings(
      "headers",
      draftSettings.headers.filter((header) => header.id !== entryId),
    );
    setSaveSuccess(null);
  }

  function updatePattern(field: "includePatterns" | "excludePatterns", index: number, value: string) {
    const current = field === "includePatterns" ? draftSettings.target.includePatterns : draftSettings.target.excludePatterns;
    const nextPatterns = current.map((pattern, patternIndex) => (patternIndex === index ? value : pattern));

    setDraftSettings("target", field, nextPatterns);
    setSaveSuccess(null);
  }

  function addPattern(field: "includePatterns" | "excludePatterns") {
    const current = field === "includePatterns" ? draftSettings.target.includePatterns : draftSettings.target.excludePatterns;
    setDraftSettings("target", field, [...current, ""]);
    setSaveSuccess(null);
  }

  function removePattern(field: "includePatterns" | "excludePatterns", index: number) {
    const current = field === "includePatterns" ? draftSettings.target.includePatterns : draftSettings.target.excludePatterns;
    setDraftSettings(
      "target",
      field,
      current.filter((_pattern, patternIndex) => patternIndex !== index),
    );
    setSaveSuccess(null);
  }

  function toggleResourceType(resourceType: ResourceType, checked: boolean) {
    setDraftSettings("target", "resourceTypes", replaceResourceType(draftSettings.target.resourceTypes, resourceType, checked));
    setSaveSuccess(null);
  }

  function patternMessages(field: "includePatterns" | "excludePatterns", pattern: string): string[] {
    return validationIssues()
      .filter((issue) => issue.type === "invalid-pattern" && issue.field === field && issue.pattern === pattern)
      .map((issue) => toValidationMessage(issue));
  }

  const summaryMessages = createMemo(() => validationIssues().map((issue) => toValidationMessage(issue)));

  return (
    <main style={pageStyle}>
      <header style={{ display: "grid", gap: "4px" }}>
        <h1 style={{ margin: "0", "font-size": "28px" }}>Header Injector</h1>
        <p style={{ margin: "0", color: "#4b5563" }}>リクエストヘッダーの付与条件と値を設定する。</p>
      </header>

      <Show when={loadError()}>
        {(message) => (
          <div style={{ ...bannerBaseStyle, "background-color": "#fef2f2", color: "#991b1b" }} role="alert">
            {message()}
          </div>
        )}
      </Show>

      <Show when={!isLoaded() && !loadError()}>
        <div style={{ ...bannerBaseStyle, "background-color": "#eff6ff", color: "#1d4ed8" }}>設定を読み込み中...</div>
      </Show>

      <Show when={isLoaded()}>
        <SettingsForm onSubmit={handleSave}>
          <Show when={hasPendingExternalUpdate()}>
            <div style={{ ...bannerBaseStyle, "background-color": "#fff7ed", color: "#9a3412" }} role="alert">
              <div>外部で設定が更新された。</div>
              <button
                style={{ margin: "8px 0 0", padding: "8px 12px", "border-radius": "8px", border: "1px solid #fdba74" }}
                type="button"
                onClick={reloadPendingExternalSettings}
              >
                再読込
              </button>
            </div>
          </Show>

          <Show when={saveError()}>
            {(message) => (
              <div style={{ ...bannerBaseStyle, "background-color": "#fef2f2", color: "#991b1b" }} role="alert">
                {message()}
              </div>
            )}
          </Show>

          <Show when={saveSuccess()}>
            {(message) => (
              <div style={{ ...bannerBaseStyle, "background-color": "#ecfdf5", color: "#166534" }} role="status">
                {message()}
              </div>
            )}
          </Show>

          <section style={panelStyle}>
            <label style={{ display: "flex", gap: "12px", "align-items": "center" }}>
              <input
                checked={draftSettings.enabled}
                type="checkbox"
                onInput={(event) => {
                  setDraftSettings("enabled", event.currentTarget.checked);
                  setSaveSuccess(null);
                }}
              />
              <span style={{ "font-weight": "600" }}>設定を有効にする</span>
            </label>
          </section>

          <section style={panelStyle}>
            <h2 style={{ margin: "0 0 12px", "font-size": "20px" }}>一致条件</h2>
            <div style={{ display: "grid", gap: "16px" }}>
              <PatternListEditor
                field="includePatterns"
                label="適用対象URL"
                messagesForPattern={(pattern) => patternMessages("includePatterns", pattern)}
                patterns={draftSettings.target.includePatterns}
                onAdd={() => addPattern("includePatterns")}
                onRemove={(index) => removePattern("includePatterns", index)}
                onUpdate={(index, value) => updatePattern("includePatterns", index, value)}
              />

              <PatternListEditor
                field="excludePatterns"
                label="除外URL"
                messagesForPattern={(pattern) => patternMessages("excludePatterns", pattern)}
                patterns={draftSettings.target.excludePatterns}
                onAdd={() => addPattern("excludePatterns")}
                onRemove={(index) => removePattern("excludePatterns", index)}
                onUpdate={(index, value) => updatePattern("excludePatterns", index, value)}
              />

              <ResourceTypeEditor
                resourceTypes={DEFAULT_RESOURCE_TYPES}
                selectedResourceTypes={draftSettings.target.resourceTypes}
                onToggle={toggleResourceType}
              />
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={{ margin: "0 0 12px", "font-size": "20px" }}>header 一覧</h2>
            <HeaderListEditor
              headers={draftSettings.headers}
              messagesForHeader={(entryId) => headerIssueMessages().get(entryId) ?? []}
              onAdd={addHeader}
              onRemove={removeHeader}
              onUpdate={updateHeader}
            />
          </section>

          <section style={panelStyle}>
            <ValidationSummary messages={summaryMessages()} />
            <div style={{ display: "flex", gap: "12px", "justify-content": "flex-end", "margin-top": "16px" }}>
              <button
                style={{ padding: "10px 16px", border: "1px solid #d1d5db", "border-radius": "8px", "background-color": "#ffffff" }}
                type="button"
                onClick={handleReset}
              >
                リセット
              </button>
              <button
                style={{
                  padding: "10px 16px",
                  border: "1px solid #2563eb",
                  "border-radius": "8px",
                  "background-color": canSave() ? "#2563eb" : "#93c5fd",
                  color: "#ffffff",
                  cursor: canSave() ? "pointer" : "not-allowed",
                }}
                disabled={!canSave()}
                type="submit"
              >
                <Show when={isSaving()} fallback="保存">
                  保存中...
                </Show>
              </button>
            </div>
          </section>
        </SettingsForm>
      </Show>
    </main>
  );
}
