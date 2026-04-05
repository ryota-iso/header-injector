/** @jsxImportSource solid-js */

import type { ResourceType } from "@header-injector/core";
import { For } from "solid-js";

export interface ResourceTypeEditorProps {
  resourceTypes: ResourceType[];
  selectedResourceTypes: ResourceType[];
  onToggle: (resourceType: ResourceType, checked: boolean) => void;
}

const resourceTypeLabels: Record<ResourceType, string> = {
  main_frame: "main_frame",
  sub_frame: "sub_frame",
  xmlhttprequest: "xmlhttprequest",
  script: "script",
  image: "image",
  font: "font",
  stylesheet: "stylesheet",
  media: "media",
  websocket: "websocket",
  other: "other",
};

const secondaryTextStyle = {
  color: "#525252",
  "font-size": "13px",
} as const;

export function ResourceTypeEditor(props: ResourceTypeEditorProps) {
  return (
    <section style={{ display: "grid", gap: "10px" }}>
      <div style={{ display: "grid", gap: "4px" }}>
        <h3 style={{ margin: "0", "font-size": "16px" }}>対象resource type</h3>
        <p style={{ margin: "0", ...secondaryTextStyle }}>適用したいリクエスト種別を選択する。</p>
      </div>

      <div style={{ display: "grid", gap: "8px", "grid-template-columns": "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <For each={props.resourceTypes}>
          {(resourceType) => (
            <label style={{ display: "flex", gap: "8px", "align-items": "center" }}>
              <input
                checked={props.selectedResourceTypes.includes(resourceType)}
                type="checkbox"
                onInput={(event) => props.onToggle(resourceType, event.currentTarget.checked)}
              />
              <span>{resourceTypeLabels[resourceType]}</span>
            </label>
          )}
        </For>
      </div>
    </section>
  );
}
