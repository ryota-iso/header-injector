/** @jsxImportSource solid-js */

import type { JSX } from "solid-js";
import { Show } from "solid-js";

import { IconButton } from "../../components/icon-button";
import { TrashIcon } from "../../components/icons";
import { TextInput } from "../../components/text-input";

export interface PatternRowProps {
  pattern: string;
  icon: JSX.Element;
  error?: string;
  placeholder?: string;
  onUpdate: (value: string) => void;
  onRemove: () => void;
}

export function PatternRow(props: PatternRowProps) {
  return (
    <div class="flex flex-col">
      <div class="flex items-center gap-3 px-5 py-3.5">
        {props.icon}
        <TextInput
          placeholder={props.placeholder ?? "https://example.com/*"}
          value={props.pattern}
          onInput={(event) => props.onUpdate(event.currentTarget.value)}
        />
        <IconButton label="Remove pattern" onClick={props.onRemove}>
          <TrashIcon />
        </IconButton>
      </div>
      <Show when={props.error}>{(message) => <p class="px-5 pb-2 text-xs text-red-600">{message()}</p>}</Show>
    </div>
  );
}
