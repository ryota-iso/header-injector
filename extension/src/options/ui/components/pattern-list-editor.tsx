/** @jsxImportSource solid-js */

import { For, Index, Show } from "solid-js";

export interface PatternListEditorProps {
  label: string;
  patterns: string[];
  messagesForPattern: (index: number) => string[];
  onAdd: () => void;
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
}

const secondaryTextStyle = {
  color: "#525252",
  "font-size": "13px",
} as const;

const inputStyle = {
  width: "100%",
  "min-width": "0",
  height: "42px",
  "box-sizing": "border-box",
  "line-height": "1.5",
  padding: "10px 12px",
  border: "1px solid #d4d4d8",
  "border-radius": "8px",
  "background-color": "#ffffff",
  color: "#111111",
} as const;

const buttonStyle = {
  height: "42px",
  "box-sizing": "border-box",
  "line-height": "1.5",
  padding: "10px 14px",
  border: "1px solid #d4d4d8",
  "border-radius": "8px",
  "background-color": "#ffffff",
  color: "#111111",
} as const;

const rowStyle = {
  display: "flex",
  gap: "8px",
  "align-items": "flex-start",
  "flex-wrap": "wrap",
} as const;

const inputWrapperStyle = {
  flex: "1 1 320px",
  "min-width": "0",
} as const;

export function PatternListEditor(props: PatternListEditorProps) {
  return (
    <section style={{ display: "grid", gap: "10px" }}>
      <div style={{ display: "grid", gap: "4px" }}>
        <h3 style={{ margin: "0", "font-size": "16px" }}>{props.label}</h3>
        <p style={{ margin: "0", ...secondaryTextStyle }}>1行に1つずつ入力する。例: https://example.com/*</p>
      </div>

      <Show when={props.patterns.length > 0} fallback={<div style={secondaryTextStyle}>まだ登録されていない。</div>}>
        <div style={{ display: "grid", gap: "10px" }}>
          <Index each={props.patterns}>
            {(pattern, index) => {
              const messages = () => props.messagesForPattern(index);

              return (
                <div style={{ display: "grid", gap: "6px" }}>
                  <div style={rowStyle}>
                    <div style={inputWrapperStyle}>
                      <input
                        style={inputStyle}
                        placeholder="https://example.com/*"
                        type="text"
                        value={pattern()}
                        onInput={(event) => props.onUpdate(index, event.currentTarget.value)}
                      />
                    </div>
                    <button style={{ ...buttonStyle, flex: "0 0 auto" }} type="button" onClick={() => props.onRemove(index)}>
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
          </Index>
        </div>
      </Show>

      <div>
        <button style={buttonStyle} type="button" onClick={props.onAdd}>
          {props.label}を追加
        </button>
      </div>
    </section>
  );
}
