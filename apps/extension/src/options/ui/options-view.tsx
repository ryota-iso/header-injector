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
import {
  canToggleEnabledImmediately,
  cloneSettings,
  createEnabledSettings,
  createHeaderId,
  getPatternValidationStates,
  isSettingsEqual,
  replaceResourceType,
} from "./lib/settings-helpers";
import { toValidationMessage } from "./lib/validation-messages";

export interface SettingsRepository {
  load(): Promise<ExtensionSettings>;
  save(settings: ExtensionSettings): Promise<void>;
  subscribe(listener: (settings: ExtensionSettings) => void): () => void;
}

export interface OptionsViewProps {
  repo: SettingsRepository;
}

const panelStyle = {
  border: "1px solid #d4d4d8",
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
  color: "#111111",
  "font-family": '"Hiragino Sans", "Noto Sans JP", sans-serif',
  "background-color": "#ffffff",
} as const;

const bannerBaseStyle = {
  padding: "12px 14px",
  "border-radius": "10px",
  "font-size": "14px",
} as const;

const neutralBannerStyle = {
  ...bannerBaseStyle,
  border: "1px solid #d4d4d8",
  "background-color": "#fafafa",
  color: "#111111",
} as const;

const secondaryTextStyle = {
  color: "#525252",
} as const;

const buttonBaseStyle = {
  height: "42px",
  "box-sizing": "border-box",
  "line-height": "1.5",
  padding: "10px 16px",
  border: "1px solid #d4d4d8",
  "border-radius": "8px",
  "background-color": "#ffffff",
  color: "#111111",
} as const;

const primaryButtonStyle = {
  ...buttonBaseStyle,
  border: "1px solid #111111",
  "background-color": "#111111",
  color: "#ffffff",
} as const;

export function OptionsView(props: OptionsViewProps) {
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
  const [isTogglingEnabled, setIsTogglingEnabled] = createSignal(false);
  const [saveError, setSaveError] = createSignal<string | null>(null);
  const [saveSuccess, setSaveSuccess] = createSignal<string | null>(null);
  const [loadError, setLoadError] = createSignal<string | null>(null);
  const [pendingExternalSettings, setPendingExternalSettings] = createSignal<ExtensionSettings | null>(null);

  const validationIssues = createMemo(() => (isLoaded() ? validateSettings(draftSettings) : []));
  const dirty = createMemo(() => (isLoaded() ? !isSettingsEqual(savedSettings, draftSettings) : false));
  const canSave = createMemo(() => dirty() && validationIssues().length === 0 && !isSaving() && !isTogglingEnabled());
  const canReset = createMemo(() => dirty() && !isSaving() && !isTogglingEnabled());
  const canToggleEnabled = createMemo(
    () => isLoaded() && canToggleEnabledImmediately(dirty()) && !isSaving() && !isTogglingEnabled(),
  );
  const hasPendingExternalUpdate = createMemo(() => pendingExternalSettings() !== null);
  const includePatternValidationStates = createMemo(() => getPatternValidationStates(draftSettings.target.includePatterns));
  const excludePatternValidationStates = createMemo(() => getPatternValidationStates(draftSettings.target.excludePatterns));

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

  async function handleEnabledToggle(nextEnabled: boolean) {
    if (!canToggleEnabled()) {
      return;
    }

    setIsTogglingEnabled(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const nextSettings = createEnabledSettings(savedSettings, nextEnabled);
      await props.repo.save(nextSettings);
      applySavedSettings(nextSettings);
      applyDraftSettings(nextSettings);
      setPendingExternalSettings(null);
      setSaveSuccess("有効状態を更新した");
    } catch {
      setSaveError("有効状態の更新に失敗した");
    } finally {
      setIsTogglingEnabled(false);
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

  const summaryMessages = createMemo(() => validationIssues().map((issue) => toValidationMessage(issue)));
  const includePatternMessages = createMemo(() =>
    draftSettings.target.includePatterns.map((pattern, index) =>
      includePatternValidationStates()[index]
        ? []
        : [toValidationMessage({ type: "invalid-pattern", field: "includePatterns", pattern })],
    ),
  );
  const excludePatternMessages = createMemo(() =>
    draftSettings.target.excludePatterns.map((pattern, index) =>
      excludePatternValidationStates()[index]
        ? []
        : [toValidationMessage({ type: "invalid-pattern", field: "excludePatterns", pattern })],
    ),
  );

  return (
    <main style={pageStyle}>
      <h1 class="text-2xl font-bold text-red-500">test</h1>
      <Show when={loadError()}>
        {(message) => (
          <div style={{ ...bannerBaseStyle, "background-color": "#fef2f2", color: "#991b1b" }} role="alert">
            {message()}
          </div>
        )}
      </Show>

      <Show when={!isLoaded() && !loadError()}>
        <div style={neutralBannerStyle}>設定を読み込み中...</div>
      </Show>

      <Show when={isLoaded()}>
        <SettingsForm onSubmit={handleSave}>
          <header
            style={{
              display: "flex",
              "justify-content": "space-between",
              "align-items": "flex-start",
              gap: "16px",
              "flex-wrap": "wrap",
            }}
          >
            <div style={{ display: "grid", gap: "4px" }}>
              <h1 style={{ margin: "0", "font-size": "28px" }}>Header Injector</h1>
              <p style={{ margin: "0", ...secondaryTextStyle }}>リクエストヘッダーの付与条件と値を設定する。</p>
            </div>

            <div style={{ display: "flex", gap: "12px", "align-items": "center", "flex-wrap": "wrap" }}>
              <button
                style={{
                  ...buttonBaseStyle,
                  cursor: canReset() ? "pointer" : "not-allowed",
                  opacity: canReset() ? "1" : "0.5",
                }}
                disabled={!canReset()}
                type="button"
                onClick={handleReset}
              >
                リセット
              </button>
              <button
                style={{
                  ...(canSave() ? primaryButtonStyle : buttonBaseStyle),
                  cursor: canSave() ? "pointer" : "not-allowed",
                  opacity: canSave() ? "1" : "0.5",
                }}
                disabled={!canSave()}
                type="submit"
              >
                <Show when={isSaving()} fallback="保存">
                  保存中...
                </Show>
              </button>
            </div>
          </header>

          <Show when={hasPendingExternalUpdate()}>
            <div style={{ ...bannerBaseStyle, "background-color": "#fff7ed", color: "#9a3412" }} role="alert">
              <div>外部で設定が更新された。</div>
              <button
                style={{
                  height: "42px",
                  "box-sizing": "border-box",
                  "line-height": "1.5",
                  margin: "8px 0 0",
                  padding: "10px 14px",
                  "border-radius": "8px",
                  border: "1px solid #fdba74",
                  "background-color": "#ffffff",
                  color: "#9a3412",
                }}
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
              <div style={neutralBannerStyle} role="status">
                {message()}
              </div>
            )}
          </Show>

          <section style={panelStyle}>
            <label style={{ display: "flex", gap: "12px", "align-items": "center" }}>
              <input
                checked={draftSettings.enabled}
                disabled={!canToggleEnabled()}
                type="checkbox"
                onInput={(event) => {
                  void handleEnabledToggle(event.currentTarget.checked);
                }}
              />
              <span style={{ "font-weight": "600" }}>設定を有効化</span>
            </label>
            <Show when={dirty()}>
              <p style={{ margin: "10px 0 0", "font-size": "13px", ...secondaryTextStyle }}>
                未保存の変更があるため、保存またはリセット後に切り替えできる。
              </p>
            </Show>
          </section>

          <section style={panelStyle}>
            <h2 style={{ margin: "0 0 12px", "font-size": "20px" }}>一致条件</h2>
            <div style={{ display: "grid", gap: "16px" }}>
              <PatternListEditor
                label="適用対象URL"
                messagesForPattern={(index) => includePatternMessages()[index] ?? []}
                patterns={draftSettings.target.includePatterns}
                onAdd={() => addPattern("includePatterns")}
                onRemove={(index) => removePattern("includePatterns", index)}
                onUpdate={(index, value) => updatePattern("includePatterns", index, value)}
              />

              <PatternListEditor
                label="除外URL"
                messagesForPattern={(index) => excludePatternMessages()[index] ?? []}
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
          </section>
        </SettingsForm>
      </Show>
    </main>
  );
}
