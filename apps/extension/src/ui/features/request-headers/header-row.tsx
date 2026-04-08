/** @jsxImportSource solid-js */

import type { HeaderEntry } from "../../../core";
import { Show } from "solid-js";

import { Checkbox } from "../../components/checkbox";
import { IconButton } from "../../components/icon-button";
import { TrashIcon } from "../../components/icons";

export interface HeaderRowProps {
  header: HeaderEntry;
  error?: string;
  onUpdate: (patch: Partial<HeaderEntry>) => void;
  onRemove: () => void;
}

const inputBaseClass =
  "w-full min-w-0 rounded-md border border-zinc-200 bg-white px-3 py-1.5 font-mono text-sm placeholder:text-zinc-300 transition focus:border-zinc-400 focus:outline-none";

export function HeaderRow(props: HeaderRowProps) {
  const colorClass = () => (props.header.enabled ? "text-zinc-900" : "text-zinc-400");

  return (
    <div class="flex flex-col">
      <div class="grid grid-cols-[60px_minmax(0,1fr)_minmax(0,1fr)_44px] items-center gap-4 px-5 py-3">
        <Checkbox
          checked={props.header.enabled}
          label={`Toggle header ${props.header.name || "(unnamed)"}`}
          onChange={(checked) => props.onUpdate({ enabled: checked })}
        />

        <input
          class={`${inputBaseClass} ${colorClass()}`}
          placeholder="Header-Name"
          type="text"
          value={props.header.name}
          onInput={(event) => props.onUpdate({ name: event.currentTarget.value })}
        />

        <input
          class={`${inputBaseClass} ${colorClass()}`}
          placeholder="value"
          type="text"
          value={props.header.value}
          onInput={(event) => props.onUpdate({ value: event.currentTarget.value })}
        />

        <div class="flex justify-end">
          <IconButton label="Remove header" onClick={props.onRemove}>
            <TrashIcon />
          </IconButton>
        </div>
      </div>

      <Show when={props.error}>{(message) => <p class="px-5 pb-2 text-xs text-red-600">{message()}</p>}</Show>
    </div>
  );
}
