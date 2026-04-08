/** @jsxImportSource solid-js */

import { Show } from "solid-js";

import { CheckIcon } from "./icons";

export interface CheckboxProps {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

export function Checkbox(props: CheckboxProps) {
  return (
    <button
      aria-checked={props.checked}
      aria-label={props.label}
      class={`flex h-[18px] w-[18px] items-center justify-center rounded border transition ${
        props.checked ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white text-transparent hover:border-zinc-400"
      }`}
      role="checkbox"
      type="button"
      onClick={() => props.onChange(!props.checked)}
    >
      <Show when={props.checked}>
        <CheckIcon class="h-3 w-3" />
      </Show>
    </button>
  );
}
