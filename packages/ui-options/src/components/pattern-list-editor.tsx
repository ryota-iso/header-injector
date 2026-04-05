/** @jsxImportSource solid-js */

import { For, Show } from "solid-js";

export interface PatternListEditorProps {
  field: "includePatterns" | "excludePatterns";
  label: string;
  patterns: string[];
  messagesForPattern: (pattern: string) => string[];
  onAdd: () => void;
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
}

export function PatternListEditor(props: PatternListEditorProps) {
  return (
    <section style={{ display: "grid", gap: "10px" }}>
      <div style={{ display: "grid", gap: "4px" }}>
        <h3 style={{ margin: "0", "font-size": "16px" }}>{props.label}</h3>
        <p style={{ margin: "0", color: "#6b7280", "font-size": "13px" }}>1行に1つずつ入力する。例: https://example.com/*</p>
      </div>

      <Show when={props.patterns.length > 0} fallback={<div style={{ color: "#6b7280" }}>まだ登録されていない。</div>}>
        <div style={{ display: "grid", gap: "10px" }}>
          <For each={props.patterns}>
            {(pattern, index) => {
              const messages = () => props.messagesForPattern(pattern);

              return (
                <div style={{ display: "grid", gap: "6px" }}>
                  <div style={{ display: "grid", gap: "8px", "grid-template-columns": "1fr auto" }}>
                    <input
                      placeholder="https://example.com/*"
                      type="text"
                      value={pattern}
                      onInput={(event) => props.onUpdate(index(), event.currentTarget.value)}
                    />
                    <button type="button" onClick={() => props.onRemove(index())}>
                      削除
                    </button>
                  </div>
                  <Show when={messages().length > 0}>
                    <ul style={{ margin: "0", padding: "0 0 0 20px", color: "#b91c1c" }}>
                      <For each={messages()}>{(message) => <li>{message}</li>}</For>
                    </ul>
                  </Show>
                </div>
              );
            }}
          </For>
        </div>
      </Show>

      <div>
        <button type="button" onClick={props.onAdd}>
          {props.label}を追加
        </button>
      </div>
    </section>
  );
}
