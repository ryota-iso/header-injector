/** @jsxImportSource solid-js */

import { For, Show } from "solid-js";

export interface ValidationSummaryProps {
  messages: string[];
}

export function ValidationSummary(props: ValidationSummaryProps) {
  return (
    <section style={{ display: "grid", gap: "10px" }}>
      <h2 style={{ margin: "0", "font-size": "20px" }}>検証結果</h2>

      <Show when={props.messages.length > 0} fallback={<div style={{ color: "#166534" }}>検証エラーはない。</div>}>
        <ul style={{ margin: "0", padding: "0 0 0 20px", color: "#b91c1c" }}>
          <For each={props.messages}>{(message) => <li>{message}</li>}</For>
        </ul>
      </Show>
    </section>
  );
}
