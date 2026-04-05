/** @jsxImportSource solid-js */

import type { HeaderEntry } from "@header-injector/core";
import { For, Show } from "solid-js";

export interface HeaderListEditorProps {
  headers: HeaderEntry[];
  messagesForHeader: (entryId: string) => string[];
  onAdd: () => void;
  onUpdate: (entryId: string, patch: Partial<HeaderEntry>) => void;
  onRemove: (entryId: string) => void;
}

export function HeaderListEditor(props: HeaderListEditorProps) {
  return (
    <section style={{ display: "grid", gap: "12px" }}>
      <Show when={props.headers.length > 0} fallback={<div style={{ color: "#6b7280" }}>まだheaderが登録されていない。</div>}>
        <div style={{ display: "grid", gap: "12px" }}>
          <For each={props.headers}>
            {(header) => {
              const messages = () => props.messagesForHeader(header.id);

              return (
                <div
                  style={{ border: "1px solid #e5e7eb", "border-radius": "10px", padding: "12px", display: "grid", gap: "10px" }}
                >
                  <label style={{ display: "flex", gap: "8px", "align-items": "center" }}>
                    <input
                      checked={header.enabled}
                      type="checkbox"
                      onInput={(event) => props.onUpdate(header.id, { enabled: event.currentTarget.checked })}
                    />
                    <span>有効</span>
                  </label>

                  <div style={{ display: "grid", gap: "10px", "grid-template-columns": "1fr 1fr auto" }}>
                    <label style={{ display: "grid", gap: "4px" }}>
                      <span>header名</span>
                      <input
                        placeholder="X-Debug"
                        type="text"
                        value={header.name}
                        onInput={(event) => props.onUpdate(header.id, { name: event.currentTarget.value })}
                      />
                    </label>

                    <label style={{ display: "grid", gap: "4px" }}>
                      <span>値</span>
                      <input
                        placeholder="1"
                        type="text"
                        value={header.value}
                        onInput={(event) => props.onUpdate(header.id, { value: event.currentTarget.value })}
                      />
                    </label>

                    <div style={{ display: "flex", "align-items": "end" }}>
                      <button type="button" onClick={() => props.onRemove(header.id)}>
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
          </For>
        </div>
      </Show>

      <div>
        <button type="button" onClick={props.onAdd}>
          headerを追加
        </button>
      </div>
    </section>
  );
}
