/** @jsxImportSource solid-js */

import { For, type JSX } from "solid-js";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: JSX.Element;
  count?: number;
}

export interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function Tabs<T extends string>(props: TabsProps<T>) {
  return (
    <div class="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 p-1">
      <For each={props.items}>
        {(item) => {
          const active = () => props.value === item.value;
          return (
            <button
              class={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                active() ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              }`}
              type="button"
              onClick={() => props.onChange(item.value)}
            >
              {item.icon}
              <span>
                {item.label}
                {item.count !== undefined ? ` (${item.count})` : ""}
              </span>
            </button>
          );
        }}
      </For>
    </div>
  );
}
