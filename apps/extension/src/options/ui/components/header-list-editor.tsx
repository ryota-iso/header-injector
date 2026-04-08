/** @jsxImportSource solid-js */

import type { HeaderEntry } from "../../../lib";
import { For, Index, Show } from "solid-js";

export interface HeaderListEditorProps {
  headers: HeaderEntry[];
  messagesForHeader: (entryId: string) => string[];
  onAdd: () => void;
  onUpdate: (entryId: string, patch: Partial<HeaderEntry>) => void;
  onRemove: (entryId: string) => void;
}

const secondaryTextStyle = {
  color: "#525252",
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

const editorRowStyle = {
  display: "flex",
  gap: "10px",
  "align-items": "flex-end",
  "flex-wrap": "wrap",
} as const;

const fieldStyle = {
  display: "grid",
  gap: "4px",
  flex: "1 1 220px",
  "min-width": "0",
} as const;

export function HeaderListEditor(props: HeaderListEditorProps) {
  return (
    <section style={{ display: "grid", gap: "12px" }}>
      <Show when={props.headers.length > 0} fallback={<div style={secondaryTextStyle}>まだheaderが登録されていない。</div>}>
        <div style={{ display: "grid", gap: "12px" }}>
          <Index each={props.headers}>
            {(header) => {
              const messages = () => props.messagesForHeader(header().id);

              return (
                <div
                  style={{ border: "1px solid #e5e7eb", "border-radius": "10px", padding: "12px", display: "grid", gap: "10px" }}
                >
                  <div style={editorRowStyle}>
                    <label style={fieldStyle}>
                      <span>header名</span>
                      <input
                        style={inputStyle}
                        placeholder="X-Debug"
                        type="text"
                        value={header().name}
                        onInput={(event) => props.onUpdate(header().id, { name: event.currentTarget.value })}
                      />
                    </label>

                    <label style={fieldStyle}>
                      <span>値</span>
                      <input
                        style={inputStyle}
                        placeholder="1"
                        type="text"
                        value={header().value}
                        onInput={(event) => props.onUpdate(header().id, { value: event.currentTarget.value })}
                      />
                    </label>

                    <div style={{ display: "flex", "justify-content": "flex-start", flex: "0 0 auto" }}>
                      <button style={buttonStyle} type="button" onClick={() => props.onRemove(header().id)}>
                        削除
                      </button>
                    </div>
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
          headerを追加
        </button>
      </div>
    </section>
  );
}
